/**
 * 🎯 에이닷 정보지도 - RDB_추천입지 자동 연산 & 시트 기록 Apps Script (안전 파싱 버전)
 * 
 * [사용 방법]
 * 1. 구글 스프레드시트 상단 메뉴 [확장 프로그램] ➔ [Apps Script] 클릭
 * 2. 기존 코드를 모두 지우고 본 코드를 전체 복사하여 붙여넣은 후 저장(Ctrl+S)
 * 3. 상단 [실행] 버튼 클릭 ➔ 3~5초 후 'RDB_추천입지' 시트에 210개 지역이 자동 기록됩니다.
 */

function calculateAndSaveRDBRecommendLocations() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.toast("🔄 3km 정밀 수치 연산 및 추천 입지 산출 중입니다...", "RDB_추천입지 연산 엔진", 10);

  // 1. 결과 시트 준비
  let targetSheet = ss.getSheetByName("RDB_추천입지");
  if (!targetSheet) {
    targetSheet = ss.insertSheet("RDB_추천입지");
  }

  // 2. 안전한 파싱 헬퍼 함수
  function safeFloat(val) {
    if (val === null || val === undefined) return 0;
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    const str = String(val).replace(/,/g, '').trim();
    const parsed = parseFloat(str);
    return isNaN(parsed) ? 0 : parsed;
  }

  function safeInt(val) {
    if (val === null || val === undefined) return 0;
    if (typeof val === 'number') return isNaN(val) ? 0 : Math.round(val);
    const str = String(val).replace(/,/g, '').trim();
    const parsed = parseInt(str, 10);
    return isNaN(parsed) ? 0 : parsed;
  }

  // 3. 탭 탐색 헬퍼 (공백 및 대소문자 허용)
  function findSheet(keywords) {
    const sheets = ss.getSheets();
    for (let i = 0; i < sheets.length; i++) {
      const name = sheets[i].getName().replace(/\s+/g, '').toLowerCase();
      for (let k = 0; k < keywords.length; k++) {
        const kw = keywords[k].replace(/\s+/g, '').toLowerCase();
        if (name.includes(kw) || kw.includes(name)) {
          return sheets[i];
        }
      }
    }
    return null;
  }

  // 4. 웹 CSV 백업 로더 헬퍼
  function fetchCsvData(url) {
    try {
      const res = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
      if (res.getResponseCode() === 200) {
        return Utilities.parseCsv(res.getContentText('UTF-8'));
      }
    } catch (e) {
      console.warn("CSV fetch error:", e);
    }
    return [];
  }

  // 5. 시트 탐색 또는 웹 CSV 백업
  const dongSheet = findSheet(['RDB_주민센터', '주민센터', '법정동']);
  const branchSheet = findSheet(['RDB_에이닷지점', '에이닷지점', '지점']);
  const schoolSheet = findSheet(['RDB_당년학교정보', '학교정보', '학교']);
  const academySheet = findSheet(['RDB_학원정보', '학원정보', '학원']);
  const aptSheet = findSheet(['RDB_아파트세대수', '아파트세대수', '아파트']);

  const dongRows = dongSheet ? dongSheet.getDataRange().getValues().slice(1) : fetchCsvData("https://docs.google.com/spreadsheets/d/e/2PACX-1vS5c-_UFAXHCib1iGRSnviv0PFCVKRtapJHMVbcV6sbFLVIkWQIy103SjP8B-HRhGDsRwxCvvx4IRhW/pub?output=csv&gid=600107051").slice(1);
  const branchRows = branchSheet ? branchSheet.getDataRange().getValues().slice(1) : fetchCsvData("https://docs.google.com/spreadsheets/d/e/2PACX-1vS5c-_UFAXHCib1iGRSnviv0PFCVKRtapJHMVbcV6sbFLVIkWQIy103SjP8B-HRhGDsRwxCvvx4IRhW/pub?output=csv&gid=211834294").slice(1);
  const schoolRows = schoolSheet ? schoolSheet.getDataRange().getValues().slice(1) : fetchCsvData("https://docs.google.com/spreadsheets/d/e/2PACX-1vS5c-_UFAXHCib1iGRSnviv0PFCVKRtapJHMVbcV6sbFLVIkWQIy103SjP8B-HRhGDsRwxCvvx4IRhW/pub?output=csv&gid=630627369").slice(1);
  const academyRows = academySheet ? academySheet.getDataRange().getValues().slice(1) : fetchCsvData("https://docs.google.com/spreadsheets/d/e/2PACX-1vS5c-_UFAXHCib1iGRSnviv0PFCVKRtapJHMVbcV6sbFLVIkWQIy103SjP8B-HRhGDsRwxCvvx4IRhW/pub?output=csv&gid=1376867691").slice(1);
  const aptRows = aptSheet ? aptSheet.getDataRange().getValues().slice(1) : fetchCsvData("https://docs.google.com/spreadsheets/d/e/2PACX-1vS5c-_UFAXHCib1iGRSnviv0PFCVKRtapJHMVbcV6sbFLVIkWQIy103SjP8B-HRhGDsRwxCvvx4IRhW/pub?output=csv&gid=642130592").slice(1);

  // 6. 데이터 파싱 (오류 방지 검증)
  const branches = [];
  branchRows.forEach(row => {
    if (!row || row.length < 3) return;
    const lat = safeFloat(row[1]);
    const lng = safeFloat(row[2]);
    if (lat > 0 && lng > 0) {
      branches.push({ name: String(row[0]), lat: lat, lng: lng });
    }
  });

  const schools = [];
  schoolRows.forEach(row => {
    if (!row || row.length < 6) return;
    const periodStr = String(row[0]);
    if (periodStr.includes('26') || periodStr.includes('2026') || periodStr === '' || periodStr.includes('Jan')) {
      const name = String(row[2]);
      const lat = safeFloat(row[3]);
      const lng = safeFloat(row[4]);
      const total = safeInt(row[5]);
      if (lat > 0 && lng > 0) {
        schools.push({
          lat: lat, lng: lng, total: total,
          isHigh: (name.includes('고등학교') || name.includes('고교')),
          isMiddle: (name.includes('중학교'))
        });
      }
    }
  });

  const academies = [];
  academyRows.forEach(row => {
    if (!row || row.length < 5) return;
    const lat = safeFloat(row[2]);
    const lng = safeFloat(row[3]);
    const count = safeInt(row[4]);
    if (lat > 0 && lng > 0) academies.push({ lat: lat, lng: lng, count: count });
  });

  const apartments = [];
  aptRows.forEach(row => {
    if (!row || row.length < 4) return;
    const count = safeInt(row[1]);
    const lat = safeFloat(row[2]);
    const lng = safeFloat(row[3]);
    if (lat > 0 && lng > 0) apartments.push({ lat: lat, lng: lng, count: count });
  });

  // 7. 하버사인 3km 입지 연산 (Bounding Box 최적화)
  const outputData = [["유형", "법정동", "중학생", "고등학생", "잠정고객수", "학원수", "아파트세대수"]];
  const LAT_DEG = 0.03;
  const LNG_DEG = 0.04;

  dongRows.forEach(row => {
    if (!row || row.length < 8) return;
    const sido = String(row[1] || '');
    const sigungu = String(row[2] || '');
    const dongName = String(row[3] || '');
    const addr = String(row[5] || '');
    const dLat = safeFloat(row[6]);
    const dLng = safeFloat(row[7]);

    if (sido.indexOf('서울') === 0 || addr.includes('서울특별시')) return;
    if (dLat <= 0 || dLng <= 0) return;

    const fullDongName = (sido + ' ' + sigungu + ' ' + dongName).trim();

    // 지점 3km 거리 체크 (예외 처리)
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

    // 학생수 3km (중학생 / 고등학생)
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

    // 추천 유형 판별 (수정된 초희소형 1.5만 세대 기준)
    const isType1 = (acad3km < 50 && potentialCust > 300 && apt3km >= 15000);
    const isType2 = (apt3km >= 50000 && potentialCust >= 400 && acad3km < 100);
    const isType3 = (potentialCust >= 700);

    if (isType1) outputData.push(["1. 초희소형", fullDongName, midStudents, highStudents, potentialCust, acad3km, apt3km]);
    if (isType2) outputData.push(["2. 세대밀집", fullDongName, midStudents, highStudents, potentialCust, acad3km, apt3km]);
    if (isType3) outputData.push(["3. 메가타겟", fullDongName, midStudents, highStudents, potentialCust, acad3km, apt3km]);
  });

  // 8. 추천 결과 구글 시트에 출력
  targetSheet.clearContents();
  if (outputData.length > 1) {
    const range = targetSheet.getRange(1, 1, outputData.length, 7);
    range.setValues(outputData);
    targetSheet.getRange(1, 1, 1, 7).setFontWeight("bold").setBackground("#4f46e5").setFontColor("#ffffff");
    targetSheet.autoResizeColumns(1, 7);
    ss.toast("🎉 연산 완료! 총 " + (outputData.length - 1) + "개 추천 법정동이 'RDB_추천입지' 시트에 저장되었습니다.", "성공", 8);
    SpreadsheetApp.getUi().alert("✅ RDB_추천입지 연산 완료!\n\n총 " + (outputData.length - 1) + "개 타겟 법정동이 시트에 성공적으로 입력되었습니다.");
  } else {
    SpreadsheetApp.getUi().alert("⚠️ 연산 결과 추천 조건에 맞는 지역이 없습니다.");
  }
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
