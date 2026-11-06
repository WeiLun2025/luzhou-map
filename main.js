/**
 * 蘆洲平行世界：蘆北開發模擬器 (Luzhou Parallel World Simulator)
 * 核心腳本：地圖渲染、情境切換 (A/B)、車流 Polyline、Landing Modal 與社群圖卡截圖生成
 */

// 全域狀態
let isScenarioA = true;
let poiData = null;
let currentMarkers = [];
let currentPolylines = [];
let showTrafficLayer = true;
let activePopupPoi = null;

// 初始視角（「回到初始視角」按鈕與首次載入共用）
const INITIAL_VIEW = { center: [25.0965, 121.4680], zoom: 15 };

// 初始化 Leaflet 地圖
const map = L.map('map', {
  zoomControl: false,
  minZoom: 13,
  maxZoom: 19
}).setView(INITIAL_VIEW.center, INITIAL_VIEW.zoom);

// 縮放按鈕置於右下角
L.control.zoom({ position: 'bottomright' }).addTo(map);

// 回到初始視角按鈕（加在縮放按鈕之後，Leaflet 會把它疊在縮放按鈕上方）
const ResetViewControl = L.Control.extend({
  options: { position: 'bottomright' },

  onAdd: function () {
    const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control reset-view-control');
    const btn = L.DomUtil.create('a', 'reset-view-btn', container);
    btn.href = '#';
    btn.setAttribute('role', 'button');
    btn.setAttribute('title', '回到初始視角');
    btn.setAttribute('aria-label', '回到初始視角');
    btn.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round" aria-hidden="true">' +
      '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2" fill="currentColor"/>' +
      '<path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>';

    // 避免點按鈕時同時觸發地圖拖曳 / 雙擊縮放
    L.DomEvent.disableClickPropagation(container);
    L.DomEvent.on(btn, 'click', function (e) {
      L.DomEvent.preventDefault(e);
      resetMapView();
    });
    return container;
  }
});
new ResetViewControl().addTo(map);

// 平滑飛回初始位置與縮放等級，並關閉開啟中的彈窗
function resetMapView() {
  map.closePopup();
  activePopupPoi = null;
  map.stop(); // 取消進行中的平移 / 縮放動畫

  const reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) {
    map.setView(INITIAL_VIEW.center, INITIAL_VIEW.zoom, { animate: false });
  } else {
    map.flyTo(INITIAL_VIEW.center, INITIAL_VIEW.zoom, { duration: 0.8 });
  }
}

// 1. 暗黑警示底圖（OpenStreetMap 繁中圖資 + CSS 高對比暗黑濾鏡，免 API Key、零浮水印）
const darkTileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> 貢獻者',
  maxZoom: 19,
  className: 'map-tiles-dark',
  crossOrigin: true
}).addTo(map);

// 2. 標準全彩街道底圖（方便對照日常街景）
const standardTileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> 貢獻者',
  maxZoom: 19,
  crossOrigin: true
});

// 3. 真實衛星空照圖（Esri World Imagery，免 API Key，可直接透視蘆北現況農地與鐵皮）
const satelliteTileLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
  attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
  maxZoom: 18,
  crossOrigin: true
});

// 加入右上角底圖切換控制
const baseMaps = {
  "🌑 暗黑警示底圖": darkTileLayer,
  "🗺️ 標準繁中街道": standardTileLayer,
  "🛰️ 真實衛星空照": satelliteTileLayer
};
L.control.layers(baseMaps, null, { position: 'topright' }).addTo(map);

// =========================================================================
// 版面量測：讓彈窗與右側控制項避開頂部導覽列 / 底部 HUD（桌機與手機通用）
// =========================================================================

// 所有彈窗共用同一組 Point 物件，視窗尺寸改變時直接修改其數值即可，不需重新綁定彈窗
const POPUP_PAD_TL = L.point(20, 95);
const POPUP_PAD_BR = L.point(20, 90);

function syncLayoutVars() {
  const root = document.documentElement;
  const nav = document.querySelector('.top-navbar');
  const hud = document.getElementById('hudBar');

  if (nav) {
    root.style.setProperty('--navbar-h', nav.offsetHeight + 'px');
    POPUP_PAD_TL.y = Math.round(nav.getBoundingClientRect().bottom) + 12;
  }
  if (hud) {
    root.style.setProperty('--hud-h', hud.offsetHeight + 'px');
    POPUP_PAD_BR.y = Math.max(0, Math.round(window.innerHeight - hud.getBoundingClientRect().top)) + 12;
  }
}

function initLayoutSync() {
  syncLayoutVars();
  window.addEventListener('resize', syncLayoutVars);
  window.addEventListener('orientationchange', syncLayoutVars);
  if (window.ResizeObserver) {
    const ro = new ResizeObserver(syncLayoutVars);
    const nav = document.querySelector('.top-navbar');
    const hud = document.getElementById('hudBar');
    if (nav) ro.observe(nav);
    if (hud) ro.observe(hud);
  }
}

// 彈窗共用設定（小螢幕自動縮窄、並避開導覽列與 HUD）
function getPopupOptions() {
  return {
    autoPan: true,
    autoPanPaddingTopLeft: POPUP_PAD_TL,
    autoPanPaddingBottomRight: POPUP_PAD_BR,
    maxWidth: Math.min(300, window.innerWidth - 48)
  };
}

// 頁面載入時讀取 POI 資料並設定 Modal 邏輯
document.addEventListener('DOMContentLoaded', () => {
  initLayoutSync();
  initLandingModal();
  loadPoiData();
});

// 初始化 Landing Page Modal
function initLandingModal() {
  const modal = document.getElementById('landingModal');
  const dontShowAgain = localStorage.getItem('luzhou_hide_landing_modal');

  // 若使用者先前沒有勾選「下次不再自動顯示」，則自動跳出
  if (dontShowAgain !== 'true') {
    modal.classList.remove('hidden');
  } else {
    modal.classList.add('hidden');
  }
}

// 關閉 Landing Modal
function closeLandingModal() {
  const modal = document.getElementById('landingModal');
  const checkbox = document.getElementById('dontShowAgainCheckbox');
  if (checkbox && checkbox.checked) {
    localStorage.setItem('luzhou_hide_landing_modal', 'true');
  }
  modal.classList.add('hidden');
}

// 開啟 Landing Modal (由頂部按鈕點擊)
function openLandingModal() {
  const modal = document.getElementById('landingModal');
  modal.classList.remove('hidden');
}

// 讀取 JSON 資料
function loadPoiData() {
  fetch('./luzhou_pois.json')
    .then(res => {
      if (!res.ok) throw new Error('無法載入 luzhou_pois.json');
      return res.json();
    })
    .then(data => {
      poiData = data;
      renderAll();
      updateHudDashboard();
    })
    .catch(err => {
      console.error('資料載入失敗：', err);
      alert('無法載入 POI 地理資料，請確認 luzhou_pois.json 存在。');
    });
}

// 切換情境 A / B
function setScenario(isA) {
  isScenarioA = isA;

  // 更新按鈕樣式
  document.getElementById('btnScenarioA').classList.toggle('active', isA);
  document.getElementById('btnScenarioB').classList.toggle('active', !isA);

  // 重新渲染圖層與更新儀表板
  renderAll();
  updateHudDashboard();
}

// 開關擬真車流路網圖層
function toggleTraffic() {
  showTrafficLayer = !showTrafficLayer;
  const btn = document.getElementById('btnToggleTraffic');
  if (btn) {
    btn.classList.toggle('active-filter', showTrafficLayer);
    btn.innerHTML = showTrafficLayer ? '🚦 車流圖層：已開啟' : '🚦 車流圖層：已關閉';
  }
  renderRoutes();
}

// 重新繪製全部地圖要素
function renderAll() {
  if (!poiData) return;
  renderPois();
  renderRoutes();
}

// 繪製 POI 爭議點位 (含脈衝動畫 Marker)
function renderPois() {
  // 清除舊標記
  currentMarkers.forEach(m => map.removeLayer(m));
  currentMarkers = [];

  const pois = poiData.features.filter(f => f.geometry.type === 'Point');

  pois.forEach(feature => {
    const [lng, lat] = feature.geometry.coordinates;
    const props = feature.properties;
    const scenario = isScenarioA ? props.scenario_A : props.scenario_B;

    if (!scenario || !scenario.visible) return;

    // 自定義 Pulse Marker HTML
    const markerColor = scenario.badge_color || (isScenarioA ? '#FF3344' : '#10B981');
    const customIcon = L.divIcon({
      className: 'poi-custom-container',
      html: `
        <div class="poi-pulse-marker" title="${props.name}">
          <div class="poi-core-dot" style="background-color: ${markerColor};"></div>
          <div class="poi-pulse-ring" style="background-color: ${markerColor};"></div>
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      popupAnchor: [0, -14]
    });

    const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);

    // 建立 Popup 內容並設定安全邊距（依導覽列 / HUD 實際尺寸動態避讓）
    const popupHTML = createPopupContent(feature, scenario);
    marker.bindPopup(popupHTML, getPopupOptions());

    // POI 節點加入 Hover 浮動提示與高亮光暈效果（比照車流圖層）
    marker.on('mouseover', () => {
      const el = marker.getElement();
      if (el) el.classList.add('poi-hover-highlight');
    });

    marker.on('mouseout', () => {
      const el = marker.getElement();
      if (el) el.classList.remove('poi-hover-highlight');
    });

    // 浮動 Tooltip 即時標籤
    const poiTooltipContent = `
      <div style="font-size:13px; font-weight:700;">
        📍 ${props.name}
      </div>
      <div style="font-size:12px; margin-top:2px; color:${isScenarioA ? '#ff99a0' : '#86efac'};">
        ${scenario.headline || scenario.status}
      </div>
    `;
    marker.bindTooltip(poiTooltipContent, {
      sticky: true,
      direction: 'top',
      offset: [0, -14],
      className: isScenarioA ? 'traffic-tooltip' : 'traffic-tooltip traffic-tooltip-safe'
    });

    marker.on('click', () => {
      activePopupPoi = feature;
    });

    currentMarkers.push(marker);
  });
}

// 建立 POI 彈窗 HTML（回歸純粹生活衝擊推演，清爽大字版）
function createPopupContent(feature, scenario) {
  const props = feature.properties;

  // 1. 🔴/🟢 情境標籤
  const scenarioTag = isScenarioA 
    ? `<span class="popup-badge popup-badge-danger">🔴 若果菜市場進駐</span>`
    : `<span class="popup-badge popup-badge-safe">🟢 若兩案脫鉤</span>`;

  // 2. 📢 醒目生活結論大字卡
  const headlineHTML = scenario.headline ? `
    <div class="popup-headline-box ${isScenarioA ? 'danger' : 'safe'}">
      ${scenario.headline}
    </div>
  ` : '';

  // 3. 📝 生活衝擊與觀察重點
  const locationHTML = props.location_description ? `
    <div class="popup-location-tag">
      📍 ${props.location_description}
    </div>
  ` : '';

  return `
    <div class="popup-container">
      <div class="popup-header-row">
        ${scenarioTag}
      </div>

      <h3 class="popup-title">${props.name}</h3>
      
      ${headlineHTML}

      <div class="popup-impact-text">
        ${scenario.impact}
      </div>

      ${locationHTML}

      <div class="popup-footer-box">
        <div class="popup-disclaimer">
          💡 本模擬為在地鄉親針對都市計畫方案之生活情境推演，非官方評估，數字多為估算，供居民理性討論家園未來。
        </div>
        <!--<div class="popup-action-row">
          <button class="btn-popup-share" onclick="generateShareCardForFeature('${feature.id}')">
            📸 分享此點生活推演圖卡
          </button>
        </div> -->
      </div>
    </div>
  `;
}

// 繪製擬真交通車流 Polyline（雙層 Hitbox 架構：徹底解決虛線難以點擊的問題 + Hover 預覽）
function renderRoutes() {
  currentPolylines.forEach(p => map.removeLayer(p));
  currentPolylines = [];

  if (!poiData || !showTrafficLayer) return;

  const routes = poiData.features.filter(f => f.geometry.type === 'LineString');

  routes.forEach(feature => {
    // GeoJSON 為 [lng, lat]，Leaflet 需要 [lat, lng]
    const latlngs = feature.geometry.coordinates.map(coord => [coord[1], coord[0]]);
    const props = feature.properties;
    const scenario = isScenarioA ? props.scenario_A : props.scenario_B;

    if (!scenario || !scenario.visible) return;

    // 1. 頂層視覺線（流動虛線或平穩實線，設定 interactive: false 避免干擾點擊）
    const visualLine = L.polyline(latlngs, {
      color: scenario.color || (isScenarioA ? '#FF2A3A' : '#10B981'),
      weight: scenario.weight || (isScenarioA ? 7 : 5),
      opacity: scenario.opacity || 0.85,
      dashArray: scenario.dashArray || null,
      className: isScenarioA ? 'traffic-polyline-danger' : 'traffic-polyline-safe',
      interactive: false
    }).addTo(map);

    // 2. 底層透明 Hitbox 感應線（寬度 24px，接收所有 click 與 hover 事件）
    const hitboxLine = L.polyline(latlngs, {
      weight: 24,
      color: '#ffffff',
      opacity: 0.001,
      interactive: true,
      className: 'traffic-hitbox'
    }).addTo(map);

    // Hover 效果：底層移入時讓頂層發光，並顯示即時 Tooltip
    hitboxLine.on('mouseover', () => {
      const el = visualLine.getElement();
      if (el) el.classList.add('traffic-hover-highlight');
    });

    hitboxLine.on('mouseout', () => {
      const el = visualLine.getElement();
      if (el) el.classList.remove('traffic-hover-highlight');
    });

    // 浮動 Tooltip（滑鼠移過即時提示）
    const tooltipContent = `
      <div style="font-size:13px; font-weight:700;">
        🚦 ${props.name}
      </div>
      <div style="font-size:12px; margin-top:2px; color:${isScenarioA ? '#ff99a0' : '#86efac'};">
        ${scenario.headline || scenario.status}
      </div>
    `;
    hitboxLine.bindTooltip(tooltipContent, {
      sticky: true,
      direction: 'top',
      offset: [0, -10],
      className: isScenarioA ? 'traffic-tooltip' : 'traffic-tooltip traffic-tooltip-safe'
    });

    // 1. 🔴/🟢 情境標籤
    const routeScenarioTag = isScenarioA 
      ? `<span class="popup-badge popup-badge-danger">🔴 若果菜市場進駐</span>`
      : `<span class="popup-badge popup-badge-safe">🟢 若兩案脫鉤</span>`;

    // 2. 📢 醒目生活結論大字卡
    const headlineHTML = scenario.headline ? `
      <div class="popup-headline-box ${isScenarioA ? 'danger' : 'safe'}">
        ${scenario.headline}
      </div>
    ` : '';

    // 3. 📝 生活衝擊與觀察重點
    const flowNoteHTML = scenario.flow_status ? `
      <div class="popup-flow-note ${isScenarioA ? 'danger' : 'safe'}">
        🚦 <b>日常路況體感：</b>${scenario.flow_status}
      </div>
    ` : '';

    const routePopupContent = `
      <div class="popup-container">
        <div class="popup-header-row">
          ${routeScenarioTag}
        </div>

        <h3 class="popup-title">${props.name}</h3>

        ${headlineHTML}

        <div class="popup-impact-text">
          ${scenario.impact}
        </div>

        ${flowNoteHTML}

        <div class="popup-footer-box">
          <div class="popup-disclaimer">
            💡 本模擬為在地鄉親針對都市計畫方案之生活情境推演，非官方評估，數字多為估算，供居民理性討論家園未來。
          </div>
          <!-- <div class="popup-action-row">
            <button class="btn-popup-share" onclick="generateShareCardForFeature('${feature.id}')">
              📸 分享此路段生活推演圖卡
            </button>
          </div> -->
        </div>
      </div>
    `;

    // 設定安全避讓邊距（依導覽列 / HUD 實際尺寸動態避讓）
    hitboxLine.bindPopup(routePopupContent, getPopupOptions());

    // 存入陣列供切換時清理
    currentPolylines.push(visualLine, hitboxLine);
  });
}

// 更新底部儀表板 HUD 數據（情境推演數值，非官方評估）
function updateHudDashboard() {
  const elTrucks = document.getElementById('hudTrucks');
  const elGreen = document.getElementById('hudGreen');
  const elHospital = document.getElementById('hudHospital');
  const elTrafficSpeed = document.getElementById('hudTrafficSpeed');

  if (isScenarioA) {
    if (elTrucks) {
      elTrucks.textContent = '估達上千輛次/日 (估算)';
      elTrucks.className = 'hud-value danger';
    }
    if (elGreen) {
      elGreen.textContent = '規劃 3.5 公頃批發市場用地';
      elGreen.className = 'hud-value danger';
    }
    if (elHospital) {
      elHospital.textContent = '恐連帶延後 (中央要求再評估)';
      elHospital.className = 'hud-value warning';
    }
    if (elTrafficSpeed) {
      elTrafficSpeed.textContent = '尖峰可能 < 15 km/h (推演)';
      elTrafficSpeed.className = 'hud-value danger';
    }
  } else {
    if (elTrucks) {
      elTrucks.textContent = '無批發車流 (維持現況)';
      elTrucks.className = 'hud-value safe';
    }
    if (elGreen) {
      elGreen.textContent = '維持公園綠地用途 (公24)';
      elGreen.className = 'hud-value safe';
    }
    if (elHospital) {
      elHospital.textContent = '可獨立審議 (兩案脫鉤)';
      elHospital.className = 'hud-value safe';
    }
    if (elTrafficSpeed) {
      elTrafficSpeed.textContent = '約 40-50 km/h (順暢)';
      elTrafficSpeed.className = 'hud-value safe';
    }
  }
}

// =========================================================================
// 社群圖卡一鍵分享功能 (整合 html2canvas)
// =========================================================================

// 為特定 Feature 產生分享圖卡
// function generateShareCardForFeature(featureId) {
//   if (!poiData) return;
//   const feature = poiData.features.find(f => f.id === featureId);
//   if (!feature) return;

//   const props = feature.properties;
//   const scenario = isScenarioA ? props.scenario_A : props.scenario_B;

//   // 定位到該 POI 或路線中心
//   if (feature.geometry.type === 'Point') {
//     map.flyTo([feature.geometry.coordinates[1], feature.geometry.coordinates[0]], 16, {
//       duration: 0.8
//     });
//   } else if (feature.geometry.type === 'LineString') {
//     const midIdx = Math.floor(feature.geometry.coordinates.length / 2);
//     const midCoord = feature.geometry.coordinates[midIdx];
//     map.flyTo([midCoord[1], midCoord[0]], 15, {
//       duration: 0.8
//     });
//   }

//   // 稍等地圖平移後擷取
//   setTimeout(() => {
//     captureAndShowShareModal(feature, scenario);
//   }, 900);
// }

// 頂部全景圖卡生成
function generateCurrentViewShareCard() {
  const currentScenarioName = isScenarioA ? '🔴 情境 A：批發市場遷入（推演）' : '🟢 情境 B：無批發市場・兩案脫鉤';
  const customFeature = {
    properties: {
      name: isScenarioA ? '蘆洲北側開發區：若果菜市場遷入的生活衝擊推演' : '蘆洲北側開發區：若不設市場的生活情境推演',
      location_description: '環堤大道沿線、蘆洲抽水站至成蘆橋區域'
    }
  };
  const customScenario = {
    status: currentScenarioName,
    impact: isScenarioA 
      ? '若批發市場遷入蘆洲，清晨可能湧入大量果菜貨車與批發車流，對環堤大道與周邊生活道路的交通與居住品質都是挑戰。（情境推演）'
      : '若不設批發市場並讓急重症醫院與果菜市場脫鉤，濱河用地可維持公園綠地，醫院也能獨立走審議程序。（情境推演）',
    badge_color: isScenarioA ? '#FF3344' : '#10B981'
  };

  captureAndShowShareModal(customFeature, customScenario);
}

// 核心擷取邏輯：抓取地圖畫面並合成至分享模板
// function captureAndShowShareModal(feature, scenario) {
//   const mapElement = document.getElementById('map');
//   const shareModal = document.getElementById('shareModal');
//   const previewImg = document.getElementById('shareCardPreview');
//   const loadingIndicator = document.getElementById('shareLoading');

//   // 開啟 Modal 並顯示載入中
//   shareModal.classList.remove('hidden');
//   loadingIndicator.style.display = 'block';
//   previewImg.style.display = 'none';

//   // 嘗試使用 html2canvas 捕捉地圖
//   html2canvas(mapElement, {
//     useCORS: true,
//     allowTaint: false,
//     logging: false,
//     scale: 1
//   }).then(canvas => {
//     // 取得地圖截圖 DataURL
//     let mapDataUrl = '';
//     try {
//       mapDataUrl = canvas.toDataURL('image/png');
//     } catch (e) {
//       console.warn('Canvas toDataURL tainted, 使用無底圖備用方案');
//     }

//     renderFinalTemplate(mapDataUrl, feature, scenario);
//   }).catch(err => {
//     console.warn('地圖底圖截圖受限，轉用純文字與圖表圖卡樣式：', err);
//     renderFinalTemplate('', feature, scenario);
//   });
// }

function renderFinalTemplate(mapDataUrl, feature, scenario) {
  const previewImg = document.getElementById('shareCardPreview');
  const loadingIndicator = document.getElementById('shareLoading');

  // 填充內容
  document.getElementById('exportCardTitle').innerText = '蘆洲平行世界：蘆北開發模擬器';
  const badgeEl = document.getElementById('exportCardBadge');
  badgeEl.innerText = isScenarioA ? '情境 A：有批發市場' : '情境 B：無批發市場';
  badgeEl.style.backgroundColor = isScenarioA ? '#FF3344' : '#10B981';
  badgeEl.style.color = isScenarioA ? '#fff' : '#064e3b';

  document.getElementById('exportCardPoiName').innerText = feature.properties.name;
  document.getElementById('exportCardStatus').innerText = `【現況狀態】${scenario.status}`;
  document.getElementById('exportCardStatus').style.color = scenario.badge_color || (isScenarioA ? '#FF3344' : '#10B981');
  document.getElementById('exportCardImpact').innerText = scenario.impact;
  document.getElementById('exportCardLocation').innerText = `📍 ${feature.properties.location_description}`;
  
  const mapImgEl = document.getElementById('exportCardMapImg');
  if (mapDataUrl) {
    mapImgEl.src = mapDataUrl;
    mapImgEl.style.display = 'block';
  } else {
    mapImgEl.style.display = 'none';
  }

  const template = document.getElementById('exportCardTemplate');

  html2canvas(template, {
    scale: 2,
    useCORS: true,
    onclone: (clonedDoc) => {
      const clonedTemplate = clonedDoc.getElementById('exportCardTemplate');
      clonedTemplate.style.display = 'block';
      clonedTemplate.style.position = 'static';
    }
  }).then(finalCanvas => {
    const finalImgData = finalCanvas.toDataURL('image/png');
    previewImg.src = finalImgData;
    previewImg.style.display = 'block';
    loadingIndicator.style.display = 'none';

    // 綁定下載按鈕
    const downloadBtn = document.getElementById('btnDownloadCard');
    downloadBtn.onclick = () => {
      const a = document.createElement('a');
      a.href = finalImgData;
      a.download = `蘆洲平行世界_模擬圖卡_${isScenarioA ? '情境A' : '情境B'}_${Date.now()}.png`;
      a.click();
    };

    // 複製按鈕 (若瀏覽器支援 ClipboardItem)
    const copyBtn = document.getElementById('btnCopyCard');
    copyBtn.onclick = () => {
      if (navigator.clipboard && window.ClipboardItem) {
        finalCanvas.toBlob(blob => {
          const item = new ClipboardItem({ 'image/png': blob });
          navigator.clipboard.write([item]).then(() => {
            alert('✅ 圖卡已成功複製到剪貼簿！可直接貼在 Facebook、LINE 或 Threads！');
          }).catch(() => {
            alert('複製失敗，請直接點擊「下載圖卡 PNG」手動儲存。');
          });
        });
      } else {
        alert('您的瀏覽器不支援直接複製圖片，請直接點擊「下載圖卡 PNG」。');
      }
    };
  }).catch(err => {
    console.error('圖卡渲染錯誤：', err);
    loadingIndicator.innerText = '圖卡生成失敗，請重試。';
  });
}

function closeShareModal() {
  document.getElementById('shareModal').classList.add('hidden');
}