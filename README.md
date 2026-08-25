# 🗺️ 전국 학교 & 학원가 & 지점 3대 데이터 통합 지도 (School & Academy Trend Map)

Google Sheets RDB 데이터와 Kakao Map API를 연동하여 **전국 학교별 3개년 학생수 추이**, **지번별 학원가 밀집도**, **교육 지점 현황** 및 **실시간 3km 반경/직선 거리 측정 기능**을 제공하는 프리미엄 대화형 지도 웹 애플리케이션입니다.

---

## 🌟 주요 기능 (Key Features)

1. **🎯 신규 출점 RDB 추천입지 시각화 (`RDB_추천입지`) [핵심 강추 입지]**:
   - 기존 에이닷 지점 반경 3km 이내를 제외하여 자기잠식(Cannibalization)을 100% 차단한 최적 신규 진출 입지 시각화.
   - **🔥 1. 초희소형**: 반경 3km 아파트 1.5만 세대 이상, 잠정고객 300명 초과임에도 학원수 50개 미만인 독점적 블루오션 입지.
   - **⚡ 2. 세대밀집**: 반경 3km 아파트 5만 세대 이상, 학원 100개 미만, 잠정고객 400명 이상의 장기 안정적 거점 입지.
   - **🖤 3. 메가타겟**: 반경 3km 잠정고객 700명 이상(중·고등 14,000명 이상)의 압도적 배후 인구 입지 (검빨 글로우 테마).

2. **🏛️ 4년제 대학교 분포 및 강사 구인 리스크 평가 (`RDB_대학주소`)**:
   - 지점 주변 반경 내 **4년제 대학교** 입지 여부를 시각화하여 파트타임/전임 강사 인력 수급 원활도를 분석.
   - 4년제 대학교 근접성이 높을수록 명문 대학생/대학원생 강사 인력풀 확보가 수월하여 **`강사 구인 리스크(Instructor Recruitment Risk)`를 최소화**.

3. **🏫 전국 학교 3개년 학생수 추이 분석 (`RDB_당년학교정보`)**:
   - 2026년 기준 **총원, 1학년, 2학년, 3학년 인원 현황** 4컬럼 카드 제공
   - **3개년(2024 ~ 2026년) 총원 변화 추이** Chart.js 선 그래프 시각화
   - 3개년 학생수 유입/유출 변화 모멘텀 **자동 분석 리포트 생성**
   - 학교 규모별 5단계 원형 히트맵 뱃지 (`1,000명 이상 🔴` ~ `400명 미만 🔵`)

4. **📚 지번주소별 학원가 밀집도 시각화 (`RDB_학원정보`)**:
   - 지번 단위 학원수 분포를 에메랄드 뱃지 마커(`📚 대치동 427개`)로 표시

5. **🎓 교육 지점 현황 및 학생수 표시 (`RDB_지점좌표`)**:
   - 교육 지점의 위치 및 등록 학생수 퍼플 네온 뱃지(`🎓 강동 92명`) 표기

6. **📏 두 점 간 실시간 직선 거리(km) 측정 도구**:
   - 지도 상 1차 클릭(시작점) → 2차 클릭(끝점) 시 **네온 레드 직선(Polyline)** 연결
   - 두 점 사이의 **직선 거리(km 또는 m)** 실시간 계산 팝업 배지 생성

7. **🎯 반경 3km 실시간 통합 집계 오버레이**:
   - 지도 클릭 시 **반경 3km 점선 원(Circle)** 생성
   - 반경 3km 내 **총 학교 수, 학교 학생수, 학원가 지번 수, 총 학원수, 지점 학생수** 실시간 종합 집계

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
