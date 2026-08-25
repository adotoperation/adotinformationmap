/**
 * 🎯 에이닷 정보지도 - RDB_추천입지 자동 계산 및 구글 시트 저장 Apps Script
 * 
 * [사용 방법]
 * 1. 구글 스프레드시트 상단 메뉴 [확장 프로그램] -> [Apps Script] 클릭
 * 2. 아래 코드를 전체 복사하여 붙여넣고 저장(Ctrl+S)
 * 3. 상단 함수 선택에서 `calculateAndSaveRDBRecommendLocations` 선택 후 [실행] 클릭
 * 4. 권한 승인 후 실행하면 'RDB_추천입지' 시트에 자동으로 연산 결과가 저장됩니다.
 */

function calculateAndSaveRDBRecommendLocations() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. 시트 존재 여부 확인 및 생성
  let targetSheet = ss.getSheetByName("RDB_추천입지");
  if (!targetSheet) {
    targetSheet = ss.insertSheet("RDB_추천입지");
  }
  
  // 2. 소스 시트 로드
  const dongSheet = ss.getSheetByName("RDB_주민센터");
  const branchSheet = ss.getSheetByName("RDB_에이닷지점");
  const schoolSheet = ss.getSheetByName("RDB_당년학교정보");
  const academySheet = ss.getSheetByName("RDB_학원정보");
  const aptSheet = ss.getSheetByName("RDB_아파트세대수");

  if (!dongSheet || !branchSheet || !schoolSheet || !academySheet || !aptSheet) {
    SpreadsheetApp.getUi().alert("⚠️ 필수 시트(RDB_주민센터, RDB_에이닷지점, RDB_당년학교정보, RDB_학원정보, RDB_아파트세대수)를 찾을 수 없습니다.");
    return;
  }

  // 데이터 로드
  const dongRows = dongSheet.getDataRange().getValues().slice(1);
  const branchRows = branchSheet.getDataRange().getValues().slice(1);
  const schoolRows = schoolSheet.getDataRange().getValues().slice(1);
  const academyRows = academySheet.getDataRange().getValues().slice(1);
  const aptRows = aptSheet.getDataRange().getValues().slice(1);

  // 3. 지점 파싱
  const branches = [];
  branchRows.forEach(row => {
    const lat = parseFloat(row[1]);
    const lng = parseFloat(row[2]);
    if (lat > 0 && lng > 0) {
      branches.push({ name: String(row[0]), lat: lat, lng: lng });
    }
  });

  // 4. 학교 파싱
  const schools = [];
  schoolRows.forEach(row => {
    const period = String(row[0]);
    if (period.indexOf('26') === 0) {
      const type = String(row[1]);
      const name = String(row[2]);
      const lat = parseFloat(row[3]);
      const lng = parseFloat(row[4]);
      const total = parseInt(row[5]) || 0;
      if (lat > 0 && lng > 0) {
        schools.push({
          lat: lat, lng: lng, total: total,
          isHigh: (type.includes('고등학교') || name.includes('고등학교') || name.includes('고교')),
          isMiddle: (type.includes('중학교') || name.includes('중학교'))
        });
      }
    }
  });

  // 5. 학원 파싱
  const academies = [];
  academyRows.forEach(row => {
    const lat = parseFloat(row[2]);
    const lng = parseFloat(row[3]);
    const count = parseInt(row[4]) || 0;
    if (lat > 0 && lng > 0) academies.push({ lat: lat, lng: lng, count: count });
  });

  // 6. 아파트 파싱
  const apartments = [];
  aptRows.forEach(row => {
    const count = parseInt(String(row[1]).replace(/,/g, '')) || 0;
    const lat = parseFloat(row[2]);
    const lng = parseFloat(row[3]);
    if (lat > 0 && lng > 0) apartments.push({ lat: lat, lng: lng, count: count });
  });

  // 7. 추천 입지 연산
  const outputData = [["유형", "법정동", "중학생", "고등학생", "잠정고객수", "학원수", "아파트세대수"]];
  const LAT_DEG = 0.03;
  const LNG_DEG = 0.04;

  dongRows.forEach(row => {
    const sido = String(row[1]);
    const sigungu = String(row[2]);
    const dongName = String(row[3]);
    const addr = String(row[5]);
    const dLat = parseFloat(row[6]);
    const dLng = parseFloat(row[7]);

    if (sido.indexOf('서울') === 0 || addr.includes('서울특별시')) return;
    if (!dLat || !dLng || dLat <= 0 || dLng <= 0) return;

    const fullDongName = (sido + ' ' + sigungu + ' ' + dongName).trim();

    // 지점 3km 거리 체크
    let hasBranch = false;
    for (let i = 0; i < branches.length; i++) {
      if (Math.abs(branches[i].lat - dLat) <= LAT_DEG && Math.abs(branches[i].lng - dLng) <= LNG_DEG) {
        if (haversineGAS(dLat, dLng, branches[i].lat, branches[i].lng) <= 3000) {
          hasBranch = true;
          break;
        }
      }
    }
    if (hasBranch) return;

    // 학원수 3km
    let acad3km = 0;
    for (let i = 0; i < academies.length; i++) {
      if (Math.abs(academies[i].lat - dLat) <= LAT_DEG && Math.abs(academies[i].lng - dLng) <= LNG_DEG) {
        if (haversineGAS(dLat, dLng, academies[i].lat, academies[i].lng) <= 3000) {
          acad3km += academies[i].count;
        }
      }
    }

    // 아파트 3km
    let apt3km = 0;
    for (let i = 0; i < apartments.length; i++) {
      if (Math.abs(apartments[i].lat - dLat) <= LAT_DEG && Math.abs(apartments[i].lng - dLng) <= LNG_DEG) {
        if (haversineGAS(dLat, dLng, apartments[i].lat, apartments[i].lng) <= 3000) {
          apt3km += apartments[i].count;
        }
      }
    }

    // 학생수 3km
    let midStudents = 0;
    let highStudents = 0;
    for (let i = 0; i < schools.length; i++) {
      if (Math.abs(schools[i].lat - dLat) <= LAT_DEG && Math.abs(schools[i].lng - dLng) <= LNG_DEG) {
        if (haversineGAS(dLat, dLng, schools[i].lat, schools[i].lng) <= 3000) {
          if (schools[i].isHigh) highStudents += schools[i].total;
          else if (schools[i].isMiddle) midStudents += schools[i].total;
        }
      }
    }

    const totalStudents = midStudents + highStudents;
    const potentialCust = Math.round(totalStudents * 0.05);

    // 조건 판별
    const isType1 = (acad3km < 50 && potentialCust > 300 && apt3km >= 15000);
    const isType2 = (apt3km >= 50000 && potentialCust >= 400 && acad3km < 100);
    const isType3 = (potentialCust >= 700);

    if (isType1) outputData.push(["1. 초희소형", fullDongName, midStudents, highStudents, potentialCust, acad3km, apt3km]);
    if (isType2) outputData.push(["2. 세대밀집", fullDongName, midStudents, highStudents, potentialCust, acad3km, apt3km]);
    if (isType3) outputData.push(["3. 메가타겟", fullDongName, midStudents, highStudents, potentialCust, acad3km, apt3km]);
  });

  // 8. 시트 출력
  targetSheet.clear();
  if (outputData.length > 1) {
    targetSheet.getRange(1, 1, outputData.length, 7).setValues(outputData);
    targetSheet.getRange(1, 1, 1, 7).setFontWeight("bold").setBackground("#4f46e5").setFontColor("#ffffff");
  }
  
  SpreadsheetApp.getUi().alert("✅ 추천 입지 계산 완료! 총 " + (outputData.length - 1) + "개 지역이 RDB_추천입지 시트에 저장되었습니다.");
}

function haversineGAS(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const phi1 = lat1 * Math.PI / 180;
  const phi2 = lat2 * Math.PI / 180;
  const deltaPhi = (lat2 - lat1) * Math.PI / 180;
  const deltaLambda = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) + Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
