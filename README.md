# 🗺️ 전국 학교 & 학원가 & 지점 3대 데이터 통합 지도 (School & Academy Trend Map)

Google Sheets RDB 데이터와 Kakao Map API를 연동하여 **전국 학교별 3개년 학생수 추이**, **지번별 학원가 밀집도**, **교육 지점 현황** 및 **실시간 3km 반경/직선 거리 측정 기능**을 제공하는 프리미엄 대화형 지도 웹 애플리케이션입니다.

---

## 🌟 주요 기능 (Key Features)

1. **🏫 전국 학교 3개년 학생수 추이 분석 (`RDB_당년학교정보`)**:
   - 2026년 기준 **총원, 1학년, 2학년, 3학년 인원 현황** 4컬럼 카드 제공
   - **3개년(2024 ~ 2026년) 총원 변화 추이** Chart.js 선 그래프 시각화
   - 3개년 학생수 유입/유출 변화 모멘텀 **자동 분석 리포트 생성**
   - 학교 규모별 5단계 원형 히트맵 뱃지 (`1,000명 이상 🔴` ~ `400명 미만 🔵`)

2. **📚 지번주소별 학원가 밀집도 시각화 (`RDB_학원정보`)**:
   - 지번 단위 학원수 분포를 에메랄드 뱃지 마커(`📚 대치동 427개`)로 표시

3. **🎓 교육 지점 현황 및 학생수 표시 (`RDB_지점좌표`)**:
   - 교육 지점의 위치 및 등록 학생수 퍼플 네온 뱃지(`🎓 강동 92명`) 표기

4. **📏 두 점 간 실시간 직선 거리(km) 측정 도구**:
   - 지도 상 1차 클릭(시작점) → 2차 클릭(끝점) 시 **네온 레드 직선(Polyline)** 연결
   - 두 점 사이의 **직선 거리(km 또는 m)** 실시간 계산 팝업 배지 생성

5. **🎯 반경 3km 실시간 통합 집계 오버레이**:
   - 지도 클릭 시 **반경 3km 점선 원(Circle)** 생성
   - 반경 3km 내 **총 학교 수, 학교 학생수, 학원가 지번 수, 총 학원수, 지점 학생수** 실시간 종합 집계

6. **❌ 원터치 이중 우클릭 초기화 지우기**:
   - 지도 마우스 우클릭 한 번으로 그려진 모든 **직선 거리 선, 반경 3km 원, 마커, 집계 라벨** 전체 지우기

---

## 🛠️ 기술 스택 (Tech Stack)

- **Frontend**: HTML5, Vanilla CSS3 (Dark Glassmorphism UI), JavaScript (ES6+)
- **Map & Geo**: Kakao Maps JavaScript SDK (CustomOverlays, Polylines, Circles, Geocoder)
- **Chart**: Chart.js v4
- **Backend / Proxy**: PowerShell Web Listener (`server.ps1`) - Google Sheets CSV Server-to-Server Proxy (CORS 우회)
- **Database**: Google Sheets (Spreadsheet ID: `1NCnmqHQ1kz0Fjay63LHdoCzXGYgwyUOhYm8cm3y6c9o`)

---

## 🚀 로컬 실행 방법 (Local Getting Started)

1. 저장소를 복사합니다:
   ```bash
   git clone https://github.com/YOUR_GITHUB_USERNAME/academy_trend_map.git
   cd academy_trend_map
   ```

2. 웹 프록시 서버를 가동합니다 (PowerShell):
   ```powershell
   powershell -ExecutionPolicy Bypass -File server.ps1
   ```

3. 브라우저에서 접속합니다:
   ```
   http://localhost:8080/
   ```

---

## 🔑 Kakao Map API 키 설정 방법

`index.html` 파일 하단의 Kakao Map SDK appkey 부분에 본인의 Kakao JavaScript Key를 입력합니다:

```html
<script type="text/javascript" src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=YOUR_KAKAO_JAVASCRIPT_KEY&libraries=clusterer,services&autoload=false"></script>
```

> **Kakao Developers 콘솔 설정 필독**:
> - [Kakao Developers](https://developers.kakao.com/) → 내 애플리케이션 → 플랫폼 → Web
> - 사이트 도메인에 `http://localhost:8080` 을 반드시 등록하셔야 지도가 정상 작동합니다.

---

## 📜 라이선스 (License)

This project is licensed under the MIT License.
