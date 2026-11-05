# 蘆洲平行世界：蘆北開發模擬器 (Luzhou Parallel World Simulator)

## 📌 專案背景與初衷
本專案為新北市蘆洲區在地居民發起的公民科技（Civic Tech）專案。
起因於 2026 新北市長選舉期間，蘆洲鄉親對於「三重果菜市場強遷蘆洲（銀河灣計畫）」的爭議與焦慮。
都市計畫爭議重點在於：
1. **108 年公開展覽草案**：規劃為公園綠地、純醫療設施（蘆洲急重症醫院）與捷運機廠。
2. **111 年都市計畫變更**：新北市政府於未經原始公展下，塞入「大台北果菜批發市場」與「水肥投入站」。
3. **內政部都委會決議**：認定屬重大變更，程序有瑕疵，退回新北市政府重審並要求重新辦理公展說明會。
4. **財務綁架疑慮**：新北市農業局長說明會提及「三重沒搬過來，銀河灣經費找不到」，導致居民擔心市府無法實質「脫鉤」。

本專案旨在透過 **2.5D/2D 互動地圖與雙情境對比（A/B Testing Slider）**，將複雜的都市計畫與生活衝擊可視化，提供蘆洲居民一個清晰、客觀且有憑有據的資訊平台。

---

## 🎯 專案目標與開發時程 constraints
- **目標上線時間**：2026 年 11 月中旬（因應 11/28 投票日衝刺）
- **開發模式**：單人全棧開發（搭配 AI 輔助）
- **視覺風格**：參考「恐怖島 / 政策島」風格，黑紅高對比警示風、極簡無花俏過場動畫、重視資訊密度與數據視覺化。

---

## 🛠 技術棧 (Tech Stack)
- **基礎架構**：單頁 HTML5 / CSS3 / JavaScript (ES6+) 或 Vite + React / Tailwind CSS
- **地圖引擎**：Leaflet.js (輕量 2D/2.5D) 或 MapLibre GL / Mapbox GL JS
- **底圖來源**：OpenStreetMap / CartoDB Dark Matter
- **部署平台**：GitHub Pages / Vercel (免費 CI/CD 靜態代管)

---

## 📂 建議專案目錄結構 (Project Directory)

```
luzhou-parallel-world/
├── index.html              # 主頁面 HTML (包含 Landing Page modal & 地圖容器)
├── styles.css              # 恐怖島警示風格樣式表
├── main.js                 # 地圖控制邏輯與情境切換腳本
├── luzhou_pois.json        # 經過地理校正的 POI 爭議點與情境資料
├── assets/                 # 靜態圖片與佐證截圖
│   └── docs/               # 內政部會議紀錄、官方網站證明文件 pdf/jpg
└── README.md
```

---

## 🗺️ 精準 POI 地理資訊與數據集 (`luzhou_pois.json`)

```json
{
  "type": "FeatureCollection",
  "metadata": {
    "project": "蘆洲平行世界：蘆北開發模擬器",
    "updated_at": "2026-11-05"
  },
  "features": [
    {
      "type": "Feature",
      "id": "poi_market",
      "geometry": {
        "type": "Point",
        "coordinates": [121.46551617450022, 25.099142562928265]
      },
      "properties": {
        "name": "批發市場與水肥投入站預定地（新北未來城）",
        "category": "dispute",
        "location_description": "環堤大道旁、捷運機廠與蘆洲抽水站之間三角形地塊（堤內）",
        "scenario_A": {
          "visible": true,
          "status": "塞入大台北果菜批發市場與水肥投入站",
          "impact": "清晨至上午交通尖峰期將湧入成百上千輛大貨車、搬運車與採購汽機車，極易造成環堤大道塞車。",
          "badge_color": "#FF3333"
        },
        "scenario_B": {
          "visible": false,
          "status": "恢復 108 年原始劃定（公24 公園預定地 / 捷運機廠周邊綠帶）",
          "impact": "維持純淨綠地空間與文教住宅環境，無大貨車噪音與空氣污染。",
          "badge_color": "#28A745"
        },
        "evidence": {
          "official_url": "https://wedid.ntpc.gov.tw/Governance/Detail/WwkvADr3lBJx",
          "official_title": "新北市政府施政成果網 - 蘆北批發市場招商案",
          "audio_quote": "農業局長說明會：『這是財務考量，三重沒搬過來，銀河灣也沒辦法執行，經費根本找不到...』"
        }
      }
    },
    {
      "type": "Feature",
      "id": "poi_pumping_station",
      "geometry": {
        "type": "Point",
        "coordinates": [121.46348672492027, 25.0995275041252]
      },
      "properties": {
        "name": "新北市政府水利局蘆洲抽水站",
        "category": "infrastructure",
        "location_description": "環堤大道與仁愛街492巷口旁",
        "scenario_A": {
          "visible": true,
          "status": "鄰近水肥投入站與批發市場",
          "impact": "111年草案將水肥投入站與批發市場劃設於抽水站周邊地塊，引發居民對惡臭與環境衛生疑慮。",
          "badge_color": "#FF9900"
        },
        "scenario_B": {
          "visible": true,
          "status": "純水利防洪機能",
          "impact": "維持原水利設施與周邊綠化防洪緩衝區。",
          "badge_color": "#17A2B8"
        },
        "evidence": {
          "official_title": "111年變更蘆洲細部計畫示意圖",
          "note": "圖中明確標示水肥投入站劃入抽水站旁。"
        }
      }
    },
    {
      "type": "Feature",
      "id": "poi_huanti_road",
      "geometry": {
        "type": "Point",
        "coordinates": [121.47285, 25.09312]
      },
      "properties": {
        "name": "水湳街與舊市區連通口（交通咽喉節點）",
        "category": "traffic",
        "location_description": "蘆洲北側開發區邊界、水湳街與環堤大道交會區域",
        "scenario_A": {
          "visible": true,
          "status": "批發市場與車流穿透舊市區風險",
          "impact": "菜車與採購機車除了走環堤大道外，極易溢散至水湳街、復興路等狹窄巷弄，加重舊市區通勤與居住區負擔。",
          "badge_color": "#DC3545"
        },
        "scenario_B": {
          "visible": true,
          "status": "維持社區單純生活路網",
          "impact": "配合輕軌與區段徵收道路，保持水湳周邊社區順暢與寧靜。",
          "badge_color": "#28A745"
        },
        "evidence": {
          "quote": "居民反映：『批發市場車流量大，周邊水湳與仁愛巷道狹窄，重車進出容易波及社區主要幹道。』"
        }
      }
    },
    {
      "type": "Feature",
      "id": "poi_hospital",
      "geometry": {
        "type": "Point",
        "coordinates": [121.46148859109414, 25.094889368347044]
      },
      "properties": {
        "name": "蘆洲急重症醫院預定地（醫療設施專區）",
        "category": "public_facility",
        "location_description": "靠近三民路與成蘆橋頭交界處附近",
        "scenario_A": {
          "visible": true,
          "status": "開發程序遭果菜市場爭議牽連而卡關",
          "impact": "因果菜市場強行納入導致整個都市計畫被內政部退回，間接延誤醫院興建與救護車進出動線規劃。",
          "badge_color": "#FF9900"
        },
        "scenario_B": {
          "visible": true,
          "status": "優先獨立推動興建",
          "impact": "兩案解聯脫鉤，加速取得衛福部與內政部核定，優先補足三蘆地區急重症醫療資源。",
          "badge_color": "#0088FF"
        },
        "evidence": {
          "official_title": "108年蘆洲南北側農業區通盤檢討草案",
          "note": "在地居民與藍綠參選人均支持醫療用地優先落地。"
        }
      }
    }
  ]
}
```

---

## 💻 主頁面基礎程式碼與地圖渲染腳本 (`index.html`)

```html
<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>蘆洲平行世界：蘆北開發模擬器</title>
  
  <!-- Leaflet CSS -->
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  
  <style>
    * { box-sizing: border-box; }
    body, html { margin: 0; padding: 0; height: 100%; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; background: #121212; color: #fff; }
    
    #map { width: 100vw; height: 100vh; z-index: 1; }
    
    /* 頂部控制面板 (恐怖島風格) */
    .top-panel {
      position: absolute;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 1000;
      background: rgba(20, 20, 20, 0.9);
      border: 1px solid #333;
      padding: 12px 24px;
      border-radius: 40px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.5);
      display: flex;
      gap: 12px;
      align-items: center;
    }
    
    .panel-btn {
      padding: 10px 20px;
      border-radius: 20px;
      border: none;
      font-weight: bold;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .btn-scenario-a { background: #FF3333; color: white; opacity: 0.6; }
    .btn-scenario-b { background: #28A745; color: white; opacity: 0.6; }
    .panel-btn.active { opacity: 1; transform: scale(1.05); box-shadow: 0 0 12px rgba(255,255,255,0.3); }

    /* Custom Popup Styles */
    .leaflet-popup-content-wrapper {
      background: #1e1e1e;
      color: #e0e0e0;
      border-radius: 8px;
      border: 1px solid #444;
    }
    .leaflet-popup-tip { background: #1e1e1e; }
    .popup-title { margin: 0 0 8px 0; font-size: 16px; color: #fff; border-bottom: 1px solid #333; padding-bottom: 6px; }
    .popup-badge { display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; margin-bottom: 8px; }
    .popup-link { color: #4da6ff; text-decoration: none; word-break: break-all; }
  </style>
</head>
<body>

  <!-- 頂部切換介面 -->
  <div class="top-panel">
    <button id="btnA" class="panel-btn btn-scenario-a active" onclick="setScenario(true)">🔴 情境 A：有批發市場</button>
    <button id="btnB" class="panel-btn btn-scenario-b" onclick="setScenario(false)">🟢 情境 B：無批發市場（兩案脫鉤）</button>
  </div>

  <!-- 地圖容器 -->
  <div id="map"></div>

  <!-- Leaflet JS -->
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

  <script>
    // 初始化地圖中心於蘆洲北側
    const map = L.map('map', {
      zoomControl: false
    }).setView([25.0965, 121.4680], 15);

    // 加上放大縮小按鈕於右下角
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // 載入 CartoDB 深色底圖 (符合恐怖島視覺感)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      maxZoom: 19
    }).addTo(map);

    let isScenarioA = true;
    let poiData = null;
    let currentMarkers = [];

    // 載入 JSON 資料
    fetch('./luzhou_pois.json')
      .then(res => res.json())
      .then(data => {
        poiData = data;
        renderMap();
      });

    function setScenario(isA) {
      isScenarioA = isA;
      document.getElementById('btnA').classList.toggle('active', isA);
      document.getElementById('btnB').classList.toggle('active', !isA);
      renderMap();
    }

    function renderMap() {
      if (!poiData) return;

      // 清除舊標記
      currentMarkers.forEach(m => map.removeLayer(m));
      currentMarkers = [];

      poiData.features.forEach(feature => {
        const [lng, lat] = feature.geometry.coordinates;
        const props = feature.properties;
        const scenario = isScenarioA ? props.scenario_A : props.scenario_B;

        if (!scenario.visible) return;

        // 畫出警示圓點標記
        const marker = L.circleMarker([lat, lng], {
          radius: 12,
          fillColor: scenario.badge_color,
          color: '#ffffff',
          weight: 2,
          fillOpacity: 0.95
        }).addTo(map);

        // 彈窗 UI 結構
        let evidenceHTML = '';
        if (props.evidence) {
          if (props.evidence.official_url) {
            evidenceHTML += `<p style="font-size:12px; margin-top:8px;">🔗 <a class="popup-link" href="${props.evidence.official_url}" target="_blank">${props.evidence.official_title}</a></p>`;
          }
          if (props.evidence.audio_quote) {
            evidenceHTML += `<p style="font-size:12px; color:#ffcc00; background:#2a2618; padding:6px; border-radius:4px; margin-top:6px;">🎙️ ${props.evidence.audio_quote}</p>`;
          }
        }

        const popupContent = `
          <h3 class="popup-title">${props.name}</h3>
          <span class="popup-badge" style="background:${scenario.badge_color}; color:#fff;">${scenario.status}</span>
          <p style="font-size:13px; line-height:1.4; margin:6px 0;"><b>影響評估：</b>${scenario.impact}</p>
          <small style="color:#aaa;">📍 ${props.location_description}</small>
          ${evidenceHTML}
        `;

        marker.bindPopup(popupContent);
        currentMarkers.push(marker);
      });
    }
  </script>
</body>
</html>
```

---

## 📌 給 VS Code AI 助理 (Antigravity/Copilot) 的接續開發 Prompts

當你在 VS Code 中使用 AI 擴充功能接續開發時，可以直接複製使用以下 Prompt：

1. **新增 Landing Page 說明彈窗**：
   > "請幫我在 `index.html` 中新增一個初次載入時跳出的 Modal 彈窗（恐怖島風格標題頁），簡述專案動機與蘆洲果菜市場爭議脈絡，包含一個『進入蘆北模擬器』的 CTA 按鈕。"

2. **新增社群圖卡一鍵分享功能**：
   > "請幫我整合 `html2canvas` 套件，在 Popup 彈窗中加入一個『分享圖卡』按鈕，讓使用者點擊時能將當前彈窗與地圖畫面截圖並儲存為圖片，方便發至 Facebook 社團。"

3. **增加擬真交通車流量圖層**：
   > "請幫我在 `luzhou_pois.json` 與 `main.js` 中新增環堤大道與重陽橋頭在情境 A 狀態下的『紅色壅塞車流折線 (Polyline)』，並在情境 B 變更為『綠色順暢折線』。"