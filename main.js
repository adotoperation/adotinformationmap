// 카카오 맵 SDK 로드 - 26/1/1 최신 데이터만 엄격 필터링 & 23학년도 이후 서울대 평균 합격자수(L열) 연동 지도 가동
(function initAllDataMapApp() {
    if (typeof kakao === 'undefined' || !kakao.maps) {
        console.error('Kakao Map SDK is not loaded!');
        const errNotice = document.getElementById('sdk-error-notice');
        if (errNotice) errNotice.style.display = 'block';
        return;
    }

    window.kakaoSdkLoaded = true;

    kakao.maps.load(() => {
        const SCHOOL_CSV_URL = `/api/data`;          // GID 630627369 : RDB_당년학교정보
        const ACADEMY_CSV_URL = `/api/academy_data`; // GID 1376867691 : RDB_학원정보
        const BRANCH_CSV_URL = `/api/branch_data`;    // GID 211834294 : RDB_지점좌표
        const APARTMENT_CSV_URL = `/api/apartment_data`; // GID 642130592 : RDB_아파트세대수

        const Z_INDEX = {
            SCHOOL: 2200,
            ACADEMY: 2500,
            BRANCH: 3500,
            LINE: 8000,
            RADIUS: 9999
        };

        let schoolMap = {};
        let academyMap = {};
        let branchDataList = [];
        let apartmentDataList = [];

        let schoolOverlays = [];
        let clusterOverlays = [];
        let academyOverlays = [];
        let branchOverlays = [];
        let apartmentOverlays = [];
        let recommendOverlays = [];
        let trendChart = null;

        let clickCircle = null;
        let clickMarker = null;
        let radiusLabel = null;

        let startPoint = null;
        let startMarker = null;
        let endMarker = null;
        let distancePolyline = null;
        let distanceBadgeOverlay = null;

        let isMarkerClickHandled = false;

        const geocoder = new kakao.maps.services.Geocoder();
        const container = document.getElementById('map');
        const options = {
            center: new kakao.maps.LatLng(37.49802, 127.05817), // 대치동 중심
            level: 7
        };
        const map = new kakao.maps.Map(container, options);

        window.copyAddressText = function (text) {
            if (!text) return;
            navigator.clipboard.writeText(text).then(() => {
                const btn = document.getElementById('btn-copy-address');
                if (btn) {
                    const orig = btn.innerHTML;
                    btn.innerHTML = '✅ 복사 완료!';
                    setTimeout(() => { btn.innerHTML = orig; }, 1500);
                }
            }).catch(err => {
                console.error('Clipboard copy failed:', err);
            });
        };

        window.clearRadiusOverlay = function (excludeRecommendCheck = false) {
            if (clickCircle) { clickCircle.setMap(null); clickCircle = null; }
            if (clickMarker) { clickMarker.setMap(null); clickMarker = null; }
            if (radiusLabel) { radiusLabel.setMap(null); radiusLabel = null; }

            if (startMarker) { startMarker.setMap(null); startMarker = null; }
            if (endMarker) { endMarker.setMap(null); endMarker = null; }
            if (distancePolyline) { distancePolyline.setMap(null); distancePolyline = null; }
            if (distanceBadgeOverlay) { distanceBadgeOverlay.setMap(null); distanceBadgeOverlay = null; }
            startPoint = null;

            // 🏆 추천 입지 마커 및 필터 체크박스 상태 소거 연동 (요청 시 제외 가능)
            if (!excludeRecommendCheck) {
                recommendOverlays.forEach(ol => ol.setMap(null));
                recommendOverlays = [];
                const chkRecommend = document.getElementById('chk-recommend');
                if (chkRecommend) chkRecommend.checked = false;
            }

            closeDetailModal();
        };

        setupUIEvents();
        loadAllGoogleSheetData();

        setInterval(() => {
            console.log('🔄 Google Sheets 실시간 최신 데이터 자동 동기화 중...');
            loadAllGoogleSheetData();
        }, 5 * 60 * 1000);

        function setupUIEvents() {
            const modalCloseBtn = document.getElementById('btn-modal-close');
            const detailModal = document.getElementById('detail-modal');
            const modalContent = document.querySelector('.modal-content');

            if (modalCloseBtn) {
                modalCloseBtn.addEventListener('click', (e) => {
                    if (e) { e.preventDefault(); e.stopPropagation(); }
                    closeDetailModal();
                });
            }

            if (detailModal) {
                detailModal.addEventListener('click', (e) => {
                    if (e) e.stopPropagation();
                    if (e.target.id === 'detail-modal') {
                        closeDetailModal();
                    }
                });
            }

            if (modalContent) {
                modalContent.addEventListener('click', (e) => {
                    if (e) e.stopPropagation();
                });
            }

            const copyBtn = document.getElementById('btn-copy-address');
            if (copyBtn) {
                copyBtn.addEventListener('click', (e) => {
                    if (e) e.stopPropagation();
                    const addr = document.getElementById('modal-address-name').textContent;
                    window.copyAddressText(addr);
                });
            }

            // 🔘 필터 체크박스 이벤트 연결
            const chkHigh = document.getElementById('chk-high');
            const chkMiddle = document.getElementById('chk-middle');
            const chkBranch = document.getElementById('chk-branch');
            const chkAcademy = document.getElementById('chk-academy');
            const chkApartment = document.getElementById('chk-apartment');

            if (chkHigh) chkHigh.addEventListener('change', () => renderSchoolMarkers());
            if (chkMiddle) chkMiddle.addEventListener('change', () => renderSchoolMarkers());
            if (chkBranch) chkBranch.addEventListener('change', () => renderBranchMarkers());
            if (chkAcademy) chkAcademy.addEventListener('change', () => renderAcademyMarkers());
            if (chkApartment) chkApartment.addEventListener('change', () => renderApartmentMarkers());

            // 🔍 통합 검색창
            const searchInput = document.getElementById('branch-search');
            const searchResults = document.getElementById('search-results');

            if (searchInput && searchResults) {
                searchInput.addEventListener('input', (e) => {
                    const keyword = e.target.value.trim().toLowerCase();
                    if (!keyword) { searchResults.style.display = 'none'; return; }

                    const matchingSchoolKeys = Object.keys(schoolMap).filter(codeKey => {
                        const item = schoolMap[codeKey];
                        return item.name.toLowerCase().includes(keyword) || item.code.toLowerCase().includes(keyword);
                    });

                    const matchingAcademies = Object.keys(academyMap).filter(addr => addr.toLowerCase().includes(keyword));
                    const matchingBranches = branchDataList.filter(b => b.name.toLowerCase().includes(keyword));
                    const matchingApts = apartmentDataList.filter(apt => apt.address.toLowerCase().includes(keyword));

                    let html = '';
                    matchingBranches.forEach(b => {
                        html += `<div class="search-item" data-type="branch" data-name="${b.name}" data-lat="${b.pos.getLat()}" data-lng="${b.pos.getLng()}">🎓 [에이닷지점] ${b.name} (학생수: ${b.studentCount}명)</div>`;
                    });
                    matchingSchoolKeys.slice(0, 8).forEach(codeKey => {
                        const item = schoolMap[codeKey];
                        const icon = item.isTop30 ? '[26년 서울대 TOP30]' : (item.isMiddle ? '🏫 [중학교]' : '🏫 [고등학교]');
                        const snuBadge = item.snuAvgCount > 0 ? ` <span style="color:#f59e0b; font-weight:800;">(23년~ 평균 ${item.snuAvgCount}명)</span>` : '';
                        html += `<div class="search-item" data-type="school" data-code="${item.code}">${icon} ${item.name}${snuBadge} (${item.code}) - 총원 ${item.total2026}명</div>`;
                    });
                    matchingAcademies.slice(0, 5).forEach(addr => {
                        const item = academyMap[addr];
                        html += `<div class="search-item" data-type="academy" data-addr="${addr}">📚 [학원가] ${addr} (학원수: ${item.count}개)</div>`;
                    });
                    matchingApts.slice(0, 5).forEach(apt => {
                        html += `<div class="search-item" data-type="apartment" data-addr="${apt.address}">🏢 [아파트] ${apt.address} (${apt.count.toLocaleString()}세대)</div>`;
                    });

                    if (html) {
                        searchResults.innerHTML = html;
                        searchResults.style.display = 'block';
                    } else {
                        searchResults.innerHTML = '<div class="search-item">결과 없음</div>';
                        searchResults.style.display = 'block';
                    }
                });

                searchResults.addEventListener('click', (e) => {
                    if (e) e.stopPropagation();
                    const item = e.target.closest('.search-item');
                    if (item) {
                        const type = item.dataset.type;
                        if (type === 'branch') {
                            const pos = new kakao.maps.LatLng(parseFloat(item.dataset.lat), parseFloat(item.dataset.lng));
                            map.setLevel(6);
                            map.panTo(pos);
                            const foundBranch = branchDataList.find(b => b.name === item.dataset.name);
                            if (foundBranch) showBranchOverlayPopup(foundBranch);
                            searchInput.value = item.dataset.name;
                        } else if (type === 'school') {
                            const code = item.dataset.code;
                            const data = schoolMap[code];
                            if (data && data.pos) {
                                map.setLevel(5);
                                map.panTo(data.pos);
                                openDetailModalByCode(code);
                            }
                            searchInput.value = data ? data.name : '';
                        } else if (type === 'academy') {
                            const addr = item.dataset.addr;
                            const data = academyMap[addr];
                            if (data && data.pos) {
                                map.setLevel(6);
                                map.panTo(data.pos);
                            }
                            searchInput.value = addr;
                        } else if (type === 'apartment') {
                            const addr = item.dataset.addr;
                            const data = apartmentDataList.find(apt => apt.address === addr);
                            if (data && data.pos) {
                                map.setLevel(6);
                                map.panTo(data.pos);
                                showApartmentOverlayPopup(data);
                            }
                            searchInput.value = addr;
                        }
                        searchResults.style.display = 'none';
                    }
                });

                document.addEventListener('click', (e) => { if (!e.target.closest('#search-box')) searchResults.style.display = 'none'; });
            }

            kakao.maps.event.addListener(map, 'click', (mouseEvent) => {
                const detailModal = document.getElementById('detail-modal');
                if (detailModal && detailModal.style.display === 'flex') return;

                if (isMarkerClickHandled) {
                    isMarkerClickHandled = false;
                    return;
                }

                handleDistanceClick(mouseEvent.latLng);
            });

            kakao.maps.event.addListener(map, 'rightclick', (mouseEvent) => {
                if (mouseEvent && mouseEvent.preventDefault) mouseEvent.preventDefault();
                window.clearRadiusOverlay();
            });

            kakao.maps.event.addListener(map, 'zoom_changed', () => {
                renderSchoolMarkers();
            });

            const chkRecommend = document.getElementById('chk-recommend');
            if (chkRecommend) {
                chkRecommend.addEventListener('change', () => {
                    recommendTop5NewBranches();
                });
            }

            container.addEventListener('contextmenu', (e) => {
                if (e) {
                    e.preventDefault();
                    e.stopPropagation();
                }
                window.clearRadiusOverlay();
                return false;
            });
        }

        function getDistance(p1, p2) {
            const poly = new kakao.maps.Polyline({ path: [p1, p2] });
            return poly.getLength();
        }

        function handleDistanceClick(clickedPos) {
            if (!startPoint) {
                window.clearRadiusOverlay();
                startPoint = clickedPos;

                startMarker = new kakao.maps.Marker({
                    position: startPoint,
                    map: map,
                    zIndex: Z_INDEX.RADIUS
                });

                drawRadius3km(startPoint);

                const badgeDiv = document.createElement('div');
                badgeDiv.className = 'distance-summary-badge';
                badgeDiv.innerHTML = `📍 <span>시작점 지정. 두 번째 지점을 클릭하세요</span>`;

                distanceBadgeOverlay = new kakao.maps.CustomOverlay({
                    position: startPoint,
                    content: badgeDiv,
                    yAnchor: 2.0,
                    zIndex: Z_INDEX.RADIUS
                });
                distanceBadgeOverlay.setMap(map);

            } else {
                if (distanceBadgeOverlay) distanceBadgeOverlay.setMap(null);

                const endPoint = clickedPos;

                endMarker = new kakao.maps.Marker({
                    position: endPoint,
                    map: map,
                    zIndex: Z_INDEX.RADIUS
                });

                distancePolyline = new kakao.maps.Polyline({
                    path: [startPoint, endPoint],
                    strokeWeight: 4,
                    strokeColor: '#ff4757',
                    strokeOpacity: 0.9,
                    strokeStyle: 'solid',
                    zIndex: Z_INDEX.LINE
                });
                distancePolyline.setMap(map);

                const meters = getDistance(startPoint, endPoint);
                let distText = '';
                if (meters >= 1000) {
                    distText = (meters / 1000).toFixed(2) + ' km';
                } else {
                    distText = Math.round(meters) + ' m';
                }

                const midLat = (startPoint.getLat() + endPoint.getLat()) / 2;
                const midLng = (startPoint.getLng() + endPoint.getLng()) / 2;
                const midPoint = new kakao.maps.LatLng(midLat, midLng);

                const badgeDiv = document.createElement('div');
                badgeDiv.className = 'distance-summary-badge';
                badgeDiv.innerHTML = `📏 직선 거리: <span class="dist-val">${distText}</span>`;

                distanceBadgeOverlay = new kakao.maps.CustomOverlay({
                    position: midPoint,
                    content: badgeDiv,
                    yAnchor: 0.5,
                    xAnchor: 0.5,
                    clickable: true,
                    zIndex: Z_INDEX.RADIUS + 100
                });
                distanceBadgeOverlay.setMap(map);

                startPoint = null;
            }
        }

        function drawRadius3km(position) {
            if (clickCircle) clickCircle.setMap(null);
            if (clickMarker) clickMarker.setMap(null);
            if (radiusLabel) radiusLabel.setMap(null);

            clickCircle = new kakao.maps.Circle({
                center: position,
                radius: 3000,
                strokeWeight: 2,
                strokeColor: '#ff4757',
                strokeOpacity: 0.85,
                strokeStyle: 'dashed',
                fillColor: '#ff4757',
                fillOpacity: 0.12,
                zIndex: Z_INDEX.RADIUS - 10
            });
            clickCircle.setMap(map);

            clickMarker = new kakao.maps.Marker({
                position: position,
                map: map,
                zIndex: Z_INDEX.RADIUS - 5
            });

            let totalSchools3km = 0;
            let totalSchoolStudents3km = 0;
            let totalHighSchools3km = 0;
            let totalHighSchoolStudents3km = 0;
            let totalMiddleSchools3km = 0;
            let totalMiddleSchoolStudents3km = 0;
            let totalAcademies3km = 0;
            let totalAcademyLocs3km = 0;
            let totalBranchStudents3km = 0;
            let totalApts3km = 0;
            let totalAptFamilies3km = 0;

            Object.keys(schoolMap).forEach(code => {
                const item = schoolMap[code];
                if (item && item.pos) {
                    const dist = getDistance(position, item.pos);
                    if (dist <= 3000) {
                        totalSchoolStudents3km += (item.total2026 || 0);
                        totalSchools3km++;

                        if (item.isMiddle) {
                            totalMiddleSchoolStudents3km += (item.total2026 || 0);
                            totalMiddleSchools3km++;
                        } else {
                            totalHighSchoolStudents3km += (item.total2026 || 0);
                            totalHighSchools3km++;
                        }
                    }
                }
            });

            Object.keys(academyMap).forEach(addr => {
                const item = academyMap[addr];
                if (item && item.pos) {
                    const dist = getDistance(position, item.pos);
                    if (dist <= 3000) {
                        totalAcademies3km += (item.count || 0);
                        totalAcademyLocs3km++;
                    }
                }
            });

            branchDataList.forEach(b => {
                if (b && b.pos) {
                    const dist = getDistance(position, b.pos);
                    if (dist <= 3000) {
                        totalBranchStudents3km += (b.studentCount || 0);
                    }
                }
            });

            apartmentDataList.forEach(apt => {
                if (apt && apt.pos) {
                    const dist = getDistance(position, apt.pos);
                    if (dist <= 3000) {
                        totalAptFamilies3km += (apt.count || 0);
                        totalApts3km++;
                    }
                }
            });

            geocoder.coord2Address(position.getLng(), position.getLat(), (result, status) => {
                let addrText = status === kakao.maps.services.Status.OK ?
                    (result[0].road_address ? result[0].road_address.address_name : result[0].address.address_name)
                    : "선택 위치";

                const labelContent = document.createElement('div');
                labelContent.className = 'radius-summary-label';

                const closeBtn = document.createElement('button');
                closeBtn.className = 'rs-close-btn';
                closeBtn.innerHTML = '✕';
                closeBtn.onclick = (e) => {
                    if (e) { e.preventDefault(); e.stopPropagation(); }
                    window.clearRadiusOverlay();
                };

                labelContent.innerHTML = `
                    <div class="rs-header">
                        <span class="rs-title">🎯 반경 3km 학교 & 학원가 & 아파트 통합 집계</span>
                    </div>
                    <div class="rs-address">📍 ${addrText}</div>
                    <div class="rs-grid">
                        <div class="rs-item"><label>🏫 반경 3km 총 학교 수 / 학생수</label><value style="color:#ff6b81;">${totalSchools3km}개교 (${totalSchoolStudents3km.toLocaleString()}명)</value></div>
                        <div class="rs-item" style="padding-left: 20px;"><label>└ 고등학교 수 / 학생수</label><value style="color:#ff7f50; font-size:13.5px;">${totalHighSchools3km}개교 (${totalHighSchoolStudents3km.toLocaleString()}명)</value></div>
                        <div class="rs-item" style="padding-left: 20px;"><label>└ 중학교 수 / 학생수</label><value style="color:#ff9f43; font-size:13.5px;">${totalMiddleSchools3km}개교 (${totalMiddleSchoolStudents3km.toLocaleString()}명)</value></div>
                        <div class="rs-item" style="padding-left: 20px;"><label>🎯 잠재 고객수 (총 학생수의 5%)</label><value style="color:#f43f5e; font-size:13.5px;">${Math.round(totalSchoolStudents3km * 0.05).toLocaleString()}명</value></div>
                        <div class="rs-item"><label>📚 반경 3km 총 학원수</label><value style="color:#1dd1a1;">${totalAcademies3km.toLocaleString()}개 (${totalAcademyLocs3km}곳)</value></div>
                        <div class="rs-item"><label>🏢 반경 3km 아파트 세대수</label><value style="color:#2ecc71;">${totalAptFamilies3km.toLocaleString()}세대 (${totalApts3km}곳)</value></div>
                        ${totalBranchStudents3km > 0 ? `<div class="rs-item"><label>🎓 반경 3km 에이닷지점 학생수</label><value style="color:#7950f2;">${totalBranchStudents3km.toLocaleString()}명</value></div>` : ''}
                    </div>
                `;

                labelContent.querySelector('.rs-header').appendChild(closeBtn);

                radiusLabel = new kakao.maps.CustomOverlay({
                    position: position,
                    content: labelContent,
                    yAnchor: 1.25,
                    clickable: true,
                    zIndex: Z_INDEX.RADIUS + 1000
                });

                radiusLabel.setMap(map);
            });
        }

        // --- 🏆 26/1/1 데이터 기준 서울대 합격자수(M열) 전국 TOP 30위권 고등학교 산출 ---
        function computeTop30SnuSchools() {
            const highSchools = Object.keys(schoolMap)
                .map(key => schoolMap[key])
                .filter(item => !item.isMiddle && item.snu2026Count > 0);

            highSchools.sort((a, b) => b.snu2026Count - a.snu2026Count);

            highSchools.forEach((item, index) => {
                if (index < 30) {
                    item.isTop30 = true;
                    item.snuRank = index + 1;
                } else {
                    item.isTop30 = false;
                    item.snuRank = index + 1;
                }
            });
        }

        function loadAllGoogleSheetData() {
            // 1. 학교 데이터 (GID: 630627369, A열: 26/1/1 연월 필터링)
            fetch(SCHOOL_CSV_URL)
                .then(response => response.text())
                .then(data => {
                    const rows = data.split('\n').slice(1);
                    schoolMap = {};

                    rows.forEach((row, idx) => {
                        if (!row.trim()) return;
                        const columns = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
                        if (columns.length < 6) return;

                        const periodRaw = (columns[0] || "").replace(/"/g, '').trim();

                        // 🔥 26/1/1 등 최신 26년도 데이터만 엄격하게 필터링! (과거 24년/25년에만 있는 학교 자동 제외)
                        if (!periodRaw.startsWith('26')) return;

                        const code = (columns[1] || "").replace(/"/g, '').trim();
                        const schoolName = (columns[2] || "").replace(/"/g, '').trim();
                        
                        const latStr = columns[3] ? columns[3].replace(/"/g, '').replace(/[^0-9.-]/g, '').trim() : '';
                        const lngStr = columns[4] ? columns[4].replace(/"/g, '').replace(/[^0-9.-]/g, '').trim() : '';
                        
                        const total2026 = parseInt(columns[5]?.replace(/"/g, '').trim()) || 0;
                        const grade1 = parseInt(columns[6]?.replace(/"/g, '').trim()) || 0;
                        const grade2 = parseInt(columns[7]?.replace(/"/g, '').trim()) || 0;
                        const grade3 = parseInt(columns[8]?.replace(/"/g, '').trim()) || 0;

                        const total2025 = (columns.length > 9 && columns[9]) ? (parseInt(columns[9].replace(/"/g, '').trim()) || total2026) : total2026;
                        const total2024 = (columns.length > 10 && columns[10]) ? (parseInt(columns[10].replace(/"/g, '').trim()) || total2025) : total2025;

                        // 🎓 L열 (11번 컬럼): 23학년도 이후 서울대 평균 합격자수
                        const snuAvgCount = (columns.length > 11 && columns[11]) ? (parseInt(columns[11].replace(/"/g, '').replace(/[^0-9]/g, '').trim()) || 0) : 0;
                        // 🎓 M열 (12번 컬럼): 26학년도 서울대 합격자수
                        const snu2026Count = (columns.length > 12 && columns[12]) ? (parseInt(columns[12].replace(/"/g, '').replace(/[^0-9]/g, '').trim()) || 0) : 0;

                        const lat = parseFloat(latStr);
                        const lng = parseFloat(lngStr);

                        if (!schoolName) return;

                        const uniqueKey = code || (schoolName + '_' + idx);
                        const isMiddle = schoolName.includes('중학교') || schoolName.includes('중학');

                        if (!schoolMap[uniqueKey]) {
                            let pos = null;
                            if (!isNaN(lat) && !isNaN(lng) && lat > 0 && lng > 0) {
                                pos = new kakao.maps.LatLng(lat, lng);
                            }

                            schoolMap[uniqueKey] = {
                                period: periodRaw,
                                code: code || 'N/A',
                                name: schoolName,
                                isMiddle: isMiddle,
                                pos: pos,
                                total2026: total2026,
                                grade1: grade1,
                                grade2: grade2,
                                grade3: grade3,
                                total2025: total2025,
                                total2024: total2024,
                                snuAvgCount: snuAvgCount,   // L열 (23학년도 이후 평균 합격자수)
                                snu2026Count: snu2026Count, // M열 (26학년도 합격자수)
                                isTop30: false,
                                snuRank: 0
                            };
                        }
                    });

                    computeTop30SnuSchools();
                    renderSchoolMarkers();
                    updateGlobalSummaryBar();
                })
                .catch(err => { console.error('School CSV Data fetch error:', err); });
 
            // 2. 학원가 데이터 (GID: 1376867691)
            fetch(ACADEMY_CSV_URL)
                .then(response => response.text())
                .then(data => {
                    const rows = data.split('\n').slice(1);
                    academyMap = {};
 
                    rows.forEach(row => {
                        if (!row.trim()) return;
                        const columns = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
                        if (columns.length < 5) return;
 
                        const jibunAddr = (columns[1] || "").replace(/"/g, '').trim();
                        const latStr = columns[2] ? columns[2].replace(/"/g, '').replace(/[^0-9.-]/g, '').trim() : '';
                        const lngStr = columns[3] ? columns[3].replace(/"/g, '').replace(/[^0-9.-]/g, '').trim() : '';
                        const count = parseInt(columns[4]?.replace(/"/g, '').trim()) || 0;
 
                        const lat = parseFloat(latStr);
                        const lng = parseFloat(lngStr);
 
                        if (!jibunAddr) return;
 
                        if (!academyMap[jibunAddr]) {
                            let pos = null;
                            if (!isNaN(lat) && !isNaN(lng) && lat > 0 && lng > 0) {
                                pos = new kakao.maps.LatLng(lat, lng);
                            }
 
                            academyMap[jibunAddr] = {
                                address: jibunAddr,
                                pos: pos,
                                count: count
                            };
                        }
                    });
 
                    renderAcademyMarkers();
                })
                .catch(err => { console.error('Academy CSV Data fetch error:', err); });
 
            // 3. 지점 데이터 (GID: 211834294)
            fetch(BRANCH_CSV_URL)
                .then(response => response.text())
                .then(data => {
                    const rows = data.split('\n').slice(1);
                    branchDataList = [];
 
                    rows.forEach(row => {
                        if (!row.trim()) return;
                        const columns = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
                        if (columns.length < 3) return;
 
                        const branchName = (columns[0] || "").replace(/"/g, '').trim();
                        const lat = parseFloat(columns[1]?.replace(/"/g, '').replace(/[^0-9.-]/g, '').trim());
                        const lng = parseFloat(columns[2]?.replace(/"/g, '').replace(/[^0-9.-]/g, '').trim());
                        const studentCount = parseInt(columns[3]?.replace(/"/g, '').trim()) || 0;
 
                        if (branchName && !isNaN(lat) && !isNaN(lng) && lat > 0 && lng > 0) {
                            const pos = new kakao.maps.LatLng(lat, lng);
                            branchDataList.push({
                                name: branchName,
                                pos: pos,
                                studentCount: studentCount
                            });
                        }
                    });
 
                    renderBranchMarkers();
                    updateGlobalSummaryBar();
                })
                .catch(err => { console.error('Branch CSV Data fetch error:', err); });

            // 4. 아파트 세대수 데이터 (GID: 642130592)
            fetch(APARTMENT_CSV_URL)
                .then(response => response.text())
                .then(data => {
                    const rows = data.split('\n').slice(1);
                    apartmentDataList = [];

                    rows.forEach(row => {
                        if (!row.trim()) return;
                        const columns = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
                        if (columns.length < 4) return;

                        const address = (columns[0] || "").replace(/"/g, '').trim();
                        const count = parseInt(columns[1]?.replace(/"/g, '').trim()) || 0;
                        const lat = parseFloat(columns[2]?.replace(/"/g, '').replace(/[^0-9.-]/g, '').trim());
                        const lng = parseFloat(columns[3]?.replace(/"/g, '').replace(/[^0-9.-]/g, '').trim());

                        if (address && !isNaN(lat) && !isNaN(lng) && lat > 0 && lng > 0) {
                            const pos = new kakao.maps.LatLng(lat, lng);
                            apartmentDataList.push({
                                address: address,
                                count: count,
                                pos: pos
                            });
                        }
                    });

                    console.log(`🏢 Apartment CSV data successfully parsed: ${apartmentDataList.length} rows`);
                    renderApartmentMarkers();
                })
                .catch(err => { console.error('Apartment CSV Data fetch error:', err); });
        }
 
        // 전역 종합 지표 바 연산 및 갱신 함수 (지점별 3km 학생수 기반)
        function updateGlobalSummaryBar() {
            const branchCount = branchDataList.length;
            const schoolKeys = Object.keys(schoolMap);
            
            if (branchCount === 0 || schoolKeys.length === 0) return;
 
            const totalBranchStudents = branchDataList.reduce((sum, b) => sum + (b.studentCount || 0), 0);
            
            // 각 지점의 3km 반경 내 학교 학생수 합산의 총합 구하기
            let totalTargetSchoolStudents = 0;
            branchDataList.forEach(b => {
                let branch3kmStudents = 0;
                schoolKeys.forEach(key => {
                    const school = schoolMap[key];
                    if (school && school.pos) {
                        const dist = getDistance(b.pos, school.pos);
                        if (dist <= 3000) {
                            branch3kmStudents += (school.total2026 || 0);
                        }
                    }
                });
                totalTargetSchoolStudents += branch3kmStudents;
            });
 
            // 점유율 계산 (실질 타겟 학생수 대비)
            let ratioText = "0.00%";
            if (totalTargetSchoolStudents > 0) {
                const ratio = (totalBranchStudents / totalTargetSchoolStudents) * 100;
                ratioText = ratio.toFixed(2) + "%";
            }
 
            // 잠정 고객수 계산 (실질 타겟 학생수의 5%를 반올림 처리)
            const potentialCustomers = Math.round(totalTargetSchoolStudents * 0.05);
 
            const bar = document.getElementById('total-summary-bar');
            const valBranch = document.getElementById('total-branch-students');
            const valRatio = document.getElementById('total-branch-ratio');
            const valPotential = document.getElementById('total-potential-customers');
 
            if (bar && valBranch && valRatio && valPotential) {
                valBranch.textContent = `${totalBranchStudents.toLocaleString()}명`;
                valRatio.textContent = ratioText;
                valPotential.textContent = `${potentialCustomers.toLocaleString()}명`;
                bar.style.display = 'flex';
            }
        }

        function getPurpleHeatmapLevelClass(totalCount) {
            if (totalCount >= 1000) return 'purple-lvl-5 size-xl';
            if (totalCount >= 800) return 'purple-lvl-4 size-lg';
            if (totalCount >= 600) return 'purple-lvl-3 size-md';
            if (totalCount >= 400) return 'purple-lvl-2 size-sm';
            return 'purple-lvl-1 size-xs';
        }

        function getAcademyCircleClass(count) {
            if (count >= 100) return 'lvl-red size-xl';
            if (count >= 80) return 'lvl-orange size-lg';
            if (count >= 60) return 'lvl-yellow size-md';
            if (count >= 40) return 'lvl-green size-sm';
            return 'lvl-blue size-xs';
        }

        // 🏫 학교 마커 렌더링
        function renderSchoolMarkers() {
            schoolOverlays.forEach(ol => ol.setMap(null));
            schoolOverlays = [];
            clusterOverlays.forEach(ol => ol.setMap(null));
            clusterOverlays = [];

            const isHighChecked = document.getElementById('chk-high')?.checked ?? false;
            const isMiddleChecked = document.getElementById('chk-middle')?.checked ?? false;

            if (!isHighChecked && !isMiddleChecked) return;

            const zoomLevel = map.getLevel();
            const schoolCodeKeys = Object.keys(schoolMap).filter(codeKey => {
                const item = schoolMap[codeKey];
                if (!item.pos) return false;

                if (item.isMiddle && !isMiddleChecked) return false;
                if (!item.isMiddle && !isHighChecked) return false;

                return true;
            });

            if (zoomLevel >= 8) {
                const clusters = [];
                const clusterThresholdMeters = zoomLevel * 600;

                schoolCodeKeys.forEach(codeKey => {
                    const item = schoolMap[codeKey];
                    let addedToCluster = false;

                    for (let c of clusters) {
                        const dist = getDistance(c.centerPos, item.pos);
                        if (dist <= clusterThresholdMeters) {
                            c.schools.push(item);
                            c.totalStudents += item.total2026;
                            c.totalSnu += item.snu2026Count;
                            addedToCluster = true;
                            break;
                        }
                    }

                    if (!addedToCluster) {
                        clusters.push({
                            centerPos: item.pos,
                            schools: [item],
                            totalStudents: item.total2026,
                            totalSnu: item.snu2026Count
                        });
                    }
                });

                clusters.forEach(c => {
                    const total = c.totalStudents;
                    const count = c.schools.length;
                    const heatClass = getPurpleHeatmapLevelClass(total);
                    const snuHtml = c.totalSnu > 0 ? `<span class="snu-tag"><img src="snu_logo.png" class="snu-icon-img" alt="SNU" /> ${c.totalSnu}명</span>` : '';

                    const labelContent = document.createElement('div');
                    labelContent.className = `circle-badge ${heatClass}`;
                    labelContent.innerHTML = `
                        ${snuHtml}
                        <span class="badge-count-num">${total.toLocaleString()}명</span>
                        <span class="badge-diff-sub">(${count}개교)</span>
                    `;

                    labelContent.onclick = (e) => {
                        if (e) { e.preventDefault(); e.stopPropagation(); }
                        isMarkerClickHandled = true;

                        if (count === 1) {
                            openDetailModalByCode(c.schools[0].code);
                        } else {
                            map.setLevel(zoomLevel - 2);
                            map.panTo(c.centerPos);
                        }
                    };

                    const overlay = new kakao.maps.CustomOverlay({
                        position: c.centerPos,
                        content: labelContent,
                        yAnchor: 0.5,
                        xAnchor: 0.5,
                        clickable: true,
                        zIndex: Z_INDEX.SCHOOL + total
                    });

                    overlay.setMap(map);
                    clusterOverlays.push(overlay);
                });

            } else {
                schoolCodeKeys.forEach(codeKey => {
                    const item = schoolMap[codeKey];
                    const total = item.total2026;
                    const heatClass = getPurpleHeatmapLevelClass(total);
                    
                    let snuHtml = '';
                    if (item.isTop30) {
                        snuHtml = `<span class="snu-tag top30"><img src="snu_logo.png" class="snu-icon-img" alt="SNU" /> TOP ${item.snuRank} (${item.snu2026Count}명)</span>`;
                    } else if (item.snu2026Count > 0) {
                        snuHtml = `<span class="snu-tag"><img src="snu_logo.png" class="snu-icon-img" alt="SNU" /> ${item.snu2026Count}명</span>`;
                    }

                    const labelContent = document.createElement('div');
                    labelContent.className = `circle-badge ${heatClass}`;
                    labelContent.innerHTML = `
                        ${snuHtml}
                        <span class="badge-count-num">${total.toLocaleString()}명</span>
                        <span class="badge-diff-sub">(🏫)</span>
                    `;

                    labelContent.onclick = (e) => {
                        if (e) { e.preventDefault(); e.stopPropagation(); }
                        isMarkerClickHandled = true;
                        openDetailModalByCode(item.code);
                    };

                    const overlay = new kakao.maps.CustomOverlay({
                        position: item.pos,
                        content: labelContent,
                        yAnchor: 0.5,
                        xAnchor: 0.5,
                        clickable: true,
                        zIndex: Z_INDEX.SCHOOL + total
                    });

                    overlay.setMap(map);
                    schoolOverlays.push(overlay);
                });
            }
        }

        // 📚 학원가 마커 렌더링
        function renderAcademyMarkers() {
            academyOverlays.forEach(ol => ol.setMap(null));
            academyOverlays = [];

            const isAcademyChecked = document.getElementById('chk-academy')?.checked ?? false;
            if (!isAcademyChecked) return;

            const addrs = Object.keys(academyMap).filter(a => academyMap[a].pos !== null);
            addrs.forEach(addr => {
                const item = academyMap[addr];
                const count = item.count;
                const circleClass = getAcademyCircleClass(count);

                const labelContent = document.createElement('div');
                labelContent.className = `academy-circle-badge ${circleClass}`;
                labelContent.innerHTML = `
                    <span class="badge-count-num">${count}개</span>
                `;

                labelContent.onclick = (e) => {
                    if (e) { e.preventDefault(); e.stopPropagation(); }
                    isMarkerClickHandled = true;
                    showAcademyOverlayPopup(item);
                };

                const overlay = new kakao.maps.CustomOverlay({
                    position: item.pos,
                    content: labelContent,
                    yAnchor: 0.5,
                    xAnchor: 0.5,
                    clickable: true,
                    zIndex: Z_INDEX.ACADEMY + count
                });

                overlay.setMap(map);
                academyOverlays.push(overlay);
            });
        }

        // 🎓 에이닷지점 마커 렌더링
        function renderBranchMarkers() {
            branchOverlays.forEach(ol => ol.setMap(null));
            branchOverlays = [];

            const isBranchChecked = document.getElementById('chk-branch')?.checked ?? true;
            if (!isBranchChecked) return;

            branchDataList.forEach(b => {
                const labelContent = document.createElement('div');
                labelContent.className = 'branch-badge';
                labelContent.innerHTML = `
                    <span>🎓 ${b.name}</span>
                    <span style="font-size:11px; opacity:0.85; background:rgba(0,0,0,0.25); padding:1px 6px; border-radius:10px;">${b.studentCount}명</span>
                `;

                labelContent.onclick = (e) => {
                    if (e) { e.preventDefault(); e.stopPropagation(); }
                    isMarkerClickHandled = true;
                    showBranchOverlayPopup(b);
                };

                const overlay = new kakao.maps.CustomOverlay({
                    position: b.pos,
                    content: labelContent,
                    yAnchor: 0.5,
                    xAnchor: 0.5,
                    clickable: true,
                    zIndex: Z_INDEX.BRANCH
                });

                overlay.setMap(map);
                branchOverlays.push(overlay);
            });
        }

        // 📚 학원가 원 클릭 전용 팝업
        function showAcademyOverlayPopup(item) {
            if (radiusLabel) radiusLabel.setMap(null);

            const labelContent = document.createElement('div');
            labelContent.className = 'radius-summary-label';

            const closeBtn = document.createElement('button');
            closeBtn.className = 'rs-close-btn';
            closeBtn.innerHTML = '✕';
            closeBtn.onclick = (e) => {
                if (e) { e.preventDefault(); e.stopPropagation(); }
                if (radiusLabel) radiusLabel.setMap(null);
            };

            labelContent.innerHTML = `
                <div class="rs-header">
                    <span class="rs-title">📚 학원가 상세 정보</span>
                </div>
                <div class="rs-address">📍 ${item.address}</div>
                <div class="rs-grid">
                    <div class="rs-item"><label>등록 학원 수</label><value style="color:#1dd1a1;">${item.count.toLocaleString()}개</value></div>
                </div>
            `;

            labelContent.querySelector('.rs-header').appendChild(closeBtn);

            radiusLabel = new kakao.maps.CustomOverlay({
                position: item.pos,
                content: labelContent,
                yAnchor: 1.25,
                clickable: true,
                zIndex: Z_INDEX.RADIUS
            });

            radiusLabel.setMap(map);
        }

        // 🎓 에이닷지점 클릭 시 반경 3km 점선 원 생성 및 반경 3km 내 학생수, 학원수, 학교수 표출
        function showBranchOverlayPopup(b) {
            window.clearRadiusOverlay();

            clickCircle = new kakao.maps.Circle({
                center: b.pos,
                radius: 3000,
                strokeWeight: 2,
                strokeColor: '#7950f2',
                strokeOpacity: 0.85,
                strokeStyle: 'dashed',
                fillColor: '#7950f2',
                fillOpacity: 0.14,
                zIndex: Z_INDEX.RADIUS - 10
            });
            clickCircle.setMap(map);

            let totalSchools3km = 0;
            let totalSchoolStudents3km = 0;
            let totalHighSchools3km = 0;
            let totalHighSchoolStudents3km = 0;
            let totalMiddleSchools3km = 0;
            let totalMiddleSchoolStudents3km = 0;
            let totalAcademies3km = 0;
            let totalAcademyLocs3km = 0;
            let totalApts3km = 0;
            let totalAptFamilies3km = 0;

            Object.keys(schoolMap).forEach(code => {
                const item = schoolMap[code];
                if (item && item.pos) {
                    const dist = getDistance(b.pos, item.pos);
                    if (dist <= 3000) {
                        totalSchoolStudents3km += (item.total2026 || 0);
                        totalSchools3km++;

                        if (item.isMiddle) {
                            totalMiddleSchoolStudents3km += (item.total2026 || 0);
                            totalMiddleSchools3km++;
                        } else {
                            totalHighSchoolStudents3km += (item.total2026 || 0);
                            totalHighSchools3km++;
                        }
                    }
                }
            });

            Object.keys(academyMap).forEach(addr => {
                const item = academyMap[addr];
                if (item && item.pos) {
                    const dist = getDistance(b.pos, item.pos);
                    if (dist <= 3000) {
                        totalAcademies3km += (item.count || 0);
                        totalAcademyLocs3km++;
                    }
                }
            });

            apartmentDataList.forEach(apt => {
                if (apt && apt.pos) {
                    const dist = getDistance(b.pos, apt.pos);
                    if (dist <= 3000) {
                        totalAptFamilies3km += (apt.count || 0);
                        totalApts3km++;
                    }
                }
            });

            // 점유율 계산 (소수점 둘째 자리까지 표시)
            let ratioText = "0%";
            if (totalSchoolStudents3km > 0) {
                const ratio = (b.studentCount / totalSchoolStudents3km) * 100;
                ratioText = ratio.toFixed(2) + "%";
            }

            // 잠정 고객수 계산 (3km 총 학생수의 5%를 반올림 처리)
            const potentialCustomers = Math.round(totalSchoolStudents3km * 0.05);

            const labelContent = document.createElement('div');
            labelContent.className = 'radius-summary-label';

            const closeBtn = document.createElement('button');
            closeBtn.className = 'rs-close-btn';
            closeBtn.innerHTML = '✕';
            closeBtn.onclick = (e) => {
                if (e) { e.preventDefault(); e.stopPropagation(); }
                window.clearRadiusOverlay();
            };

            labelContent.innerHTML = `
                <div class="rs-header">
                    <span class="rs-title" style="color:#7950f2;">🎓 에이닷 ${b.name} 지점 (반경 3km 분석)</span>
                </div>
                <div class="rs-address">📍 지점 학생수: <b style="color:#7950f2;">${b.studentCount.toLocaleString()}명</b> <span style="font-size:11px; font-weight:normal; color:#aaa; margin-left:4px;">(점유율: ${ratioText} ※ 반경 3km 학생수 합계 대비 점유율)</span></div>
                <div class="rs-address" style="margin-top:4px;">🎯 잠정 고객수: <b style="color:#ff6b81;">${potentialCustomers.toLocaleString()}명</b> <span style="font-size:11px; font-weight:normal; color:#aaa; margin-left:4px;">(반경 3km 학생수 합계 대비 5% 학생수)</span></div>
                <div class="rs-grid" style="margin-top:8px;">
                    <div class="rs-item"><label>🏫 반경 3km 총 학교 수 / 총 학생수</label><value style="color:#ff6b81;">${totalSchools3km}개교 (${totalSchoolStudents3km.toLocaleString()}명)</value></div>
                    <div class="rs-item" style="padding-left: 20px;"><label>└ 고등학교 수 / 학생수</label><value style="color:#ff7f50; font-size:13.5px;">${totalHighSchools3km}개교 (${totalHighSchoolStudents3km.toLocaleString()}명)</value></div>
                    <div class="rs-item" style="padding-left: 20px;"><label>└ 중학교 수 / 학생수</label><value style="color:#ff9f43; font-size:13.5px;">${totalMiddleSchools3km}개교 (${totalMiddleSchoolStudents3km.toLocaleString()}명)</value></div>
                    <div class="rs-item"><label>📚 반경 3km 총 학원 수</label><value style="color:#1dd1a1;">${totalAcademies3km.toLocaleString()}개 (${totalAcademyLocs3km}곳)</value></div>
                    <div class="rs-item"><label>🏢 반경 3km 아파트 세대수</label><value style="color:#2ecc71;">${totalAptFamilies3km.toLocaleString()}세대 (${totalApts3km}곳)</value></div>
                </div>
            `;

            labelContent.querySelector('.rs-header').appendChild(closeBtn);

            radiusLabel = new kakao.maps.CustomOverlay({
                position: b.pos,
                content: labelContent,
                yAnchor: 1.25,
                clickable: true,
                zIndex: Z_INDEX.RADIUS + 1000
            });

            radiusLabel.setMap(map);
        }

        function generateAnalysisSummaryText(item) {
            const v24 = item.total2024;
            const v25 = item.total2025;
            const v26 = item.total2026;

            const diff1yr = v26 - v25;
            const diff2yr = v26 - v24;

            let text = "";
            if (diff1yr > 0 && diff2yr > 0) {
                text = `🔥 <b>지속 성장 학교</b>: 2024년(${v24}명) 대비 2년 누적 <b>+${diff2yr}명</b> 학생수가 증가하였으며, 최근 1년 동안에도 <b>+${diff1yr}명</b> 늘어나 유입이 지속되는 인기 선호 학교입니다.`;
            } else if (diff1yr < 0 && diff2yr > 0) {
                text = `📈 <b>누적 성장 / 최근 소폭 감소</b>: 2년 전(${v24}명) 대비 전체적으로는 <b>+${diff2yr}명</b> 유지하였으나, 최근 1년 사이 <b>${diff1yr}명</b> 줄어들어 안정적 정원을 형성하고 있습니다.`;
            } else if (diff1yr < 0 && diff2yr < 0) {
                text = `🔻 <b>학생수 감소 추세</b>: 2024년(${v24}명) 대비 2년간 총 <b>${diff2yr}명</b> 감소하였고, 최근 1년간에도 <b>${diff1yr}명</b> 줄어들어 학생수 유출 및 학급 조정을 받는 학교입니다.`;
            } else if (diff1yr > 0 && diff2yr < 0) {
                text = `🌱 <b>반등 회복 학교</b>: 2년 누적으로는 <b>${diff2yr}명</b> 하락했으나, 최근 1년간 <b>+${diff1yr}명</b> 유입 반등에 성공하며 학생수가 회복되는 학교입니다.`;
            } else {
                text = `━ <b>유지 / 보합 학교</b>: 학원 및 학생 수 수치가 안정적인 수준(${v26}명)을 유지하고 있는 평탄한 학교입니다.`;
            }
            return text;
        }

        // 🎓 모달 팝업 오픈 시 "23학년도 이후 서울대 평균 합격자수" (L열 데이터) 연동!
        function openDetailModalByCode(schoolCode) {
            const item = schoolMap[schoolCode];
            if (!item) return;

            const modal = document.getElementById('detail-modal');
            document.getElementById('modal-address-name').textContent = item.name;
            document.getElementById('modal-school-code').textContent = `학교코드: ${item.code || 'N/A'}`;

            const top30Badge = document.getElementById('modal-top30-badge');
            if (top30Badge) {
                if (item.isTop30) {
                    top30Badge.innerHTML = `26학년도 서울대 TOP 30위권 (전국 ${item.snuRank}위)`;
                    top30Badge.style.display = 'inline-flex';
                } else {
                    top30Badge.style.display = 'none';
                }
            }

            const v26 = item.total2026;
            const g1 = item.grade1;
            const g2 = item.grade2;
            const g3 = item.grade3;
            const v25 = item.total2025;
            const v24 = item.total2024;
            
            // 🎓 모달 요약 카드는 L열 데이터 (23학년도 이후 서울대 평균 합격자수) 연동!
            const snuAvgCount = item.snuAvgCount;

            document.getElementById('val-total').textContent = `${v26.toLocaleString()}명`;
            document.getElementById('val-g1').textContent = `${g1.toLocaleString()}명`;
            document.getElementById('val-g2').textContent = `${g2.toLocaleString()}명`;
            document.getElementById('val-g3').textContent = `${g3.toLocaleString()}명`;

            document.getElementById('val-2024').textContent = `${v24.toLocaleString()}명`;
            document.getElementById('val-2025').textContent = `${v25.toLocaleString()}명`;
            document.getElementById('val-2026').textContent = `${v26.toLocaleString()}명`;

            const snuCard = document.getElementById('snu-card-container');
            const valSnu = document.getElementById('val-snu-count');
            if (snuCard && valSnu) {
                if (snuAvgCount > 0) {
                    valSnu.textContent = `${snuAvgCount}명`;
                    snuCard.style.display = 'block';
                } else {
                    snuCard.style.display = 'none';
                }
            }

            document.getElementById('analysis-summary-text').innerHTML = generateAnalysisSummaryText(item);

            renderTrendChart([v24, v25, v26]);
            modal.style.display = 'flex';
        }

        function closeDetailModal() {
            document.getElementById('detail-modal').style.display = 'none';
        }

        function renderTrendChart(dataArray) {
            const ctx = document.getElementById('trendChart').getContext('2d');

            if (trendChart) {
                trendChart.destroy();
            }

            trendChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: ['2024년 (2년전)', '2025년 (1년전)', '2026년 (현재)'],
                    datasets: [{
                        label: '학교 총원 (명)',
                        data: dataArray,
                        borderColor: '#ba68c8',
                        backgroundColor: 'rgba(186, 104, 200, 0.2)',
                        borderWidth: 3,
                        pointBackgroundColor: '#e1bee7',
                        pointRadius: 6,
                        pointHoverRadius: 8,
                        fill: true,
                        tension: 0.3
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        x: {
                            grid: { color: 'rgba(255, 255, 255, 0.05)' },
                            ticks: { color: 'rgba(255, 255, 255, 0.7)', font: { family: 'Outfit', size: 12 } }
                        },
                        y: {
                            grid: { color: 'rgba(255, 255, 255, 0.05)' },
                            ticks: { color: 'rgba(255, 255, 255, 0.7)', font: { family: 'Outfit', size: 12 } }
                        }
                    }
                }
            });
        }

        // 🏢 아파트 세대수 마커 렌더링
        function renderApartmentMarkers() {
            apartmentOverlays.forEach(ol => ol.setMap(null));
            apartmentOverlays = [];

            const isApartmentChecked = document.getElementById('chk-apartment')?.checked ?? false;
            console.log(`🏢 Checking apartment filter state: ${isApartmentChecked}. Current data size: ${apartmentDataList.length}`);
            if (!isApartmentChecked) return;

            apartmentDataList.forEach(apt => {
                const circleClass = getApartmentCircleClass(apt.count);

                const labelContent = document.createElement('div');
                labelContent.className = `apartment-circle-badge ${circleClass}`;
                labelContent.innerHTML = `
                    <span class="badge-count-num">${apt.count.toLocaleString()}세대</span>
                `;

                labelContent.onclick = (e) => {
                    if (e) { e.preventDefault(); e.stopPropagation(); }
                    isMarkerClickHandled = true;
                    showApartmentOverlayPopup(apt);
                };

                const overlay = new kakao.maps.CustomOverlay({
                    position: apt.pos,
                    content: labelContent,
                    yAnchor: 0.5,
                    xAnchor: 0.5,
                    clickable: true,
                    zIndex: Z_INDEX.ACADEMY - 50 // 학원가보다 약간 아래 레이어
                });

                overlay.setMap(map);
                apartmentOverlays.push(overlay);
            });
        }

        // 🏢 아파트 세대수 색상 스케일 매핑
        function getApartmentCircleClass(count) {
            if (count >= 10000) return 'apt-lvl-darkgreen size-xl';
            if (count >= 8000) return 'apt-lvl-green size-lg';
            if (count >= 6000) return 'apt-lvl-medgreen size-md';
            if (count >= 4000) return 'apt-lvl-lightgreen size-sm';
            return 'apt-lvl-lime size-xs';
        }

        // 🏢 아파트 클릭 전용 팝업
        function showApartmentOverlayPopup(apt) {
            if (radiusLabel) radiusLabel.setMap(null);

            const labelContent = document.createElement('div');
            labelContent.className = 'radius-summary-label';

            const closeBtn = document.createElement('button');
            closeBtn.className = 'rs-close-btn';
            closeBtn.innerHTML = '✕';
            closeBtn.onclick = (e) => {
                if (e) { e.preventDefault(); e.stopPropagation(); }
                if (radiusLabel) radiusLabel.setMap(null);
            };

            labelContent.innerHTML = `
                <div class="rs-header">
                    <span class="rs-title" style="color:#2ecc71;">🏢 아파트 상세 정보</span>
                </div>
                <div class="rs-address">📍 ${apt.address}</div>
                <div class="rs-grid">
                    <div class="rs-item"><label>아파트 세대수</label><value style="color:#2ecc71;">${apt.count.toLocaleString()}세대</value></div>
                </div>
            `;

            labelContent.querySelector('.rs-header').appendChild(closeBtn);

            radiusLabel = new kakao.maps.CustomOverlay({
                position: apt.pos,
                content: labelContent,
                yAnchor: 1.25,
                clickable: true,
                zIndex: Z_INDEX.RADIUS + 1000
            });

            radiusLabel.setMap(map);
        }

        // 🏆 에이닷 신규 지점 최적지 추천 기능
        function recommendTop5NewBranches() {
            window.clearRadiusOverlay(true);
            recommendOverlays.forEach(ol => ol.setMap(null));
            recommendOverlays = [];

            const isChecked = document.getElementById('chk-recommend')?.checked ?? false;
            if (!isChecked) return;

            const candidates = [];
            const visitedCoords = new Set();

            const checkAndAdd = (pos, name) => {
                if (!pos) return;
                const key = `${pos.getLat().toFixed(4)}_${pos.getLng().toFixed(4)}`;
                if (!visitedCoords.has(key)) {
                    visitedCoords.add(key);
                    candidates.push({ pos: pos, name: name });
                }
            };

            apartmentDataList.forEach(apt => checkAndAdd(apt.pos, apt.address));
            Object.keys(academyMap).forEach(key => checkAndAdd(academyMap[key].pos, academyMap[key].address));

            if (candidates.length === 0) {
                alert("입지 분석을 위한 데이터가 충분하지 않습니다.");
                return;
            }

            const results = [];

            candidates.forEach(c => {
                // 조건 1: 기존 에이닷 지점과의 3km 중복 제거 (3km 초과 거리만 가능)
                let hasExistingBranch3km = false;
                for (let b of branchDataList) {
                    if (getDistance(c.pos, b.pos) <= 3000) {
                        hasExistingBranch3km = true;
                        break;
                    }
                }
                if (hasExistingBranch3km) return;

                // 3km 반경 내 집계 시뮬레이션
                let schoolStudents = 0;
                let highStudents = 0;
                let middleStudents = 0;
                let highSchools = 0;
                let middleSchools = 0;
                let academyCount = 0;
                let aptFamilies = 0;

                Object.keys(schoolMap).forEach(code => {
                    const school = schoolMap[code];
                    if (school && school.pos && getDistance(c.pos, school.pos) <= 3000) {
                        schoolStudents += (school.total2026 || 0);
                        if (school.isMiddle) {
                            middleStudents += (school.total2026 || 0);
                            middleSchools++;
                        } else {
                            highStudents += (school.total2026 || 0);
                            highSchools++;
                        }
                    }
                });

                Object.keys(academyMap).forEach(addr => {
                    const academy = academyMap[addr];
                    if (academy && academy.pos && getDistance(c.pos, academy.pos) <= 3000) {
                        academyCount += (academy.count || 0);
                    }
                });

                apartmentDataList.forEach(apt => {
                    if (apt && apt.pos && getDistance(c.pos, apt.pos) <= 3000) {
                        aptFamilies += (apt.count || 0);
                    }
                });

                // 조건 2: 아파트 배후 세대수 1만 세대 이상 보장
                if (aptFamilies < 10000) return;

                // 조건 3: 중, 고등학생 수 합계 8천 명 이상 보장
                if (schoolStudents < 8000) return;

                results.push({
                    name: c.name,
                    pos: c.pos,
                    schoolStudents: schoolStudents,
                    highStudents: highStudents,
                    middleStudents: middleStudents,
                    highSchools: highSchools,
                    middleSchools: middleSchools,
                    academyCount: academyCount,
                    aptFamilies: aptFamilies
                });
            });

            // 조건 4: 배후 학교 학생수 기준 내림차순 정렬
            results.sort((a, b) => b.schoolStudents - a.schoolStudents);
            const top5 = results; // 이름은 top5로 유지하여 하위 코드 호환성 유지 (전체 노출)

            if (top5.length === 0) {
                alert("조건(기존 지점 3km 이외, 아파트 1만세대 이상, 학생수 8천명 이상)을 모두 충족하는 신규 후보지가 없습니다.");
                return;
            }

            // 모든 최적지 마커 그리기
            top5.forEach((item, index) => {
                const rank = index + 1;
                const badge = document.createElement('div');
                badge.className = `recommend-badge ${rank <= 3 ? 'rank-top3' : ''}`;
                badge.innerHTML = `<span class="rank-num-title">👑 ${rank}위</span><span>${item.name}</span>`;

                badge.onclick = (e) => {
                    if (e) { e.preventDefault(); e.stopPropagation(); }
                    showRecommendDetailPopup(item, rank);
                };

                const overlay = new kakao.maps.CustomOverlay({
                    position: item.pos,
                    content: badge,
                    yAnchor: 0.5,
                    xAnchor: 0.5,
                    zIndex: Z_INDEX.RADIUS + 50
                });

                overlay.setMap(map);
                recommendOverlays.push(overlay);
            });

            // 1위 후보지로 카메라 이동
            map.setLevel(6);
            map.panTo(top5[0].pos);
        }

        // 🏆 추천 최적지 클릭 전용 팝업
        function showRecommendDetailPopup(item, rank) {
            if (radiusLabel) radiusLabel.setMap(null);

            const labelContent = document.createElement('div');
            labelContent.className = 'radius-summary-label';

            const closeBtn = document.createElement('button');
            closeBtn.className = 'rs-close-btn';
            closeBtn.innerHTML = '✕';
            closeBtn.onclick = (e) => {
                if (e) { e.preventDefault(); e.stopPropagation(); }
                // 🏆 추천 마커 및 필터 체크박스 상태 소거 연동
                recommendOverlays.forEach(ol => ol.setMap(null));
                recommendOverlays = [];
                const chkRecommend = document.getElementById('chk-recommend');
                if (chkRecommend) chkRecommend.checked = false;

                if (radiusLabel) radiusLabel.setMap(null);
            };

            labelContent.innerHTML = `
                <div class="rs-header">
                    <span class="rs-title" style="color:#f59e0b;">👑 신규 입지 ${rank}위 요약</span>
                </div>
                <div class="rs-address">📍 추천 권역: <b>${item.name}</b></div>
                <div class="rs-grid" style="margin-top: 8px;">
                    <div class="rs-item"><label>🏫 중·고교 총 학생수</label><value style="color:#ff6b81;">${item.schoolStudents.toLocaleString()}명</value></div>
                    <div class="rs-item"><label>🎯 잠재 고객수 (5%)</label><value style="color:#f43f5e;">${Math.round(item.schoolStudents * 0.05).toLocaleString()}명</value></div>
                    <div class="rs-item"><label>🏢 배후 아파트 세대수</label><value style="color:#2ecc71;">${item.aptFamilies.toLocaleString()}세대</value></div>
                </div>
            `;

            labelContent.querySelector('.rs-header').appendChild(closeBtn);

            radiusLabel = new kakao.maps.CustomOverlay({
                position: item.pos,
                content: labelContent,
                yAnchor: 1.25,
                clickable: true,
                zIndex: Z_INDEX.RADIUS + 1000
            });

            radiusLabel.setMap(map);
        }
    });
})();
