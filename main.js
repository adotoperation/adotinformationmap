// 카카오 맵 SDK 로드 및 구글 시트 실시간 자동 연동 (Auto Refresh 5분)
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

        let schoolOverlays = [];
        let academyOverlays = [];
        let branchOverlays = [];
        let trendChart = null;

        let clickCircle = null;
        let clickMarker = null;
        let radiusLabel = null;

        let startPoint = null;
        let startMarker = null;
        let endMarker = null;
        let distancePolyline = null;
        let distanceBadgeOverlay = null;

        const geocoder = new kakao.maps.services.Geocoder();
        const container = document.getElementById('map');
        const options = {
            center: new kakao.maps.LatLng(37.49802, 127.05817), // 대치동 중심
            level: 8
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

        window.clearRadiusOverlay = function () {
            if (clickCircle) { clickCircle.setMap(null); clickCircle = null; }
            if (clickMarker) { clickMarker.setMap(null); clickMarker = null; }
            if (radiusLabel) { radiusLabel.setMap(null); radiusLabel = null; }

            if (startMarker) { startMarker.setMap(null); startMarker = null; }
            if (endMarker) { endMarker.setMap(null); endMarker = null; }
            if (distancePolyline) { distancePolyline.setMap(null); distancePolyline = null; }
            if (distanceBadgeOverlay) { distanceBadgeOverlay.setMap(null); distanceBadgeOverlay = null; }
            startPoint = null;

            closeDetailModal();
        };

        setupUIEvents();
        loadAllGoogleSheetData(); // 최초 수집

        // 🔄 5분마다 구글 시트 최신 데이터 실시간 자동 연동 (Auto Sync)
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

            const searchInput = document.getElementById('branch-search');
            const searchResults = document.getElementById('search-results');

            if (searchInput && searchResults) {
                searchInput.addEventListener('input', (e) => {
                    const keyword = e.target.value.trim().toLowerCase();
                    if (!keyword) { searchResults.style.display = 'none'; return; }

                    const matchingSchools = Object.keys(schoolMap).filter(name => name.toLowerCase().includes(keyword));
                    const matchingAcademies = Object.keys(academyMap).filter(addr => addr.toLowerCase().includes(keyword));
                    const matchingBranches = branchDataList.filter(b => b.name.toLowerCase().includes(keyword));

                    let html = '';
                    matchingBranches.forEach(b => {
                        html += `<div class="search-item" data-type="branch" data-name="${b.name}" data-lat="${b.pos.getLat()}" data-lng="${b.pos.getLng()}">🎓 [지점] ${b.name} (학생수: ${b.studentCount}명)</div>`;
                    });
                    matchingSchools.slice(0, 5).forEach(name => {
                        const item = schoolMap[name];
                        html += `<div class="search-item" data-type="school" data-name="${name}">🏫 [학교] ${name} (총원: ${item.total2026}명)</div>`;
                    });
                    matchingAcademies.slice(0, 5).forEach(addr => {
                        const item = academyMap[addr];
                        html += `<div class="search-item" data-type="academy" data-addr="${addr}">📚 [학원가] ${addr} (학원수: ${item.count}개)</div>`;
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
                            map.panTo(pos);
                            drawRadius3km(pos);
                            searchInput.value = item.dataset.name;
                        } else if (type === 'school') {
                            const schoolName = item.dataset.name;
                            const data = schoolMap[schoolName];
                            if (data && data.pos) {
                                map.panTo(data.pos);
                                openDetailModal(schoolName);
                            }
                            searchInput.value = schoolName;
                        } else if (type === 'academy') {
                            const addr = item.dataset.addr;
                            const data = academyMap[addr];
                            if (data && data.pos) {
                                map.panTo(data.pos);
                                drawRadius3km(data.pos);
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

                handleDistanceClick(mouseEvent.latLng);
            });

            kakao.maps.event.addListener(map, 'rightclick', (mouseEvent) => {
                if (mouseEvent && mouseEvent.preventDefault) mouseEvent.preventDefault();
                window.clearRadiusOverlay();
            });

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
            let totalAcademies3km = 0;
            let totalAcademyLocs3km = 0;
            let totalBranchStudents3km = 0;

            Object.keys(schoolMap).forEach(name => {
                const item = schoolMap[name];
                if (item && item.pos) {
                    const dist = getDistance(position, item.pos);
                    if (dist <= 3000) {
                        totalSchoolStudents3km += (item.total2026 || 0);
                        totalSchools3km++;
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
                        <span class="rs-title">🎯 반경 3km 학교 & 학원가 통합 집계</span>
                    </div>
                    <div class="rs-address">📍 ${addrText}</div>
                    <div class="rs-grid">
                        <div class="rs-item"><label>🏫 반경 3km 학교 수 / 학생수</label><value style="color:#ff6b81;">${totalSchools3km}개교 (${totalSchoolStudents3km.toLocaleString()}명)</value></div>
                        <div class="rs-item"><label>📚 반경 3km 총 학원수</label><value style="color:#1dd1a1;">${totalAcademies3km.toLocaleString()}개 (${totalAcademyLocs3km}곳)</value></div>
                        ${totalBranchStudents3km > 0 ? `<div class="rs-item"><label>🎓 반경 3km 지점 학생수</label><value style="color:#7950f2;">${totalBranchStudents3km.toLocaleString()}명</value></div>` : ''}
                    </div>
                `;

                labelContent.querySelector('.rs-header').appendChild(closeBtn);

                radiusLabel = new kakao.maps.CustomOverlay({
                    position: position,
                    content: labelContent,
                    yAnchor: 1.25,
                    clickable: true,
                    zIndex: Z_INDEX.RADIUS
                });

                radiusLabel.setMap(map);
            });
        }

        // --- 구글 시트 3대 데이터 일괄 로드 함수 ---
        function loadAllGoogleSheetData() {
            // 1. 학교 데이터 (GID: 630627369)
            fetch(SCHOOL_CSV_URL)
                .then(response => response.text())
                .then(data => {
                    const rows = data.split('\n').slice(1);
                    schoolMap = {};

                    rows.forEach(row => {
                        if (!row.trim()) return;
                        const columns = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
                        if (columns.length < 6) return;

                        const periodRaw = (columns[0] || "").replace(/"/g, '').trim();
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

                        const lat = parseFloat(latStr);
                        const lng = parseFloat(lngStr);

                        if (!schoolName) return;

                        if (!schoolMap[schoolName]) {
                            let pos = null;
                            if (!isNaN(lat) && !isNaN(lng) && lat > 0 && lng > 0) {
                                pos = new kakao.maps.LatLng(lat, lng);
                            }

                            schoolMap[schoolName] = {
                                period: '2026년',
                                code: code,
                                name: schoolName,
                                pos: pos,
                                total2026: total2026,
                                grade1: grade1,
                                grade2: grade2,
                                grade3: grade3,
                                total2025: total2025,
                                total2024: total2024
                            };
                        }
                    });

                    renderSchoolMarkers();
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
                })
                .catch(err => { console.error('Branch CSV Data fetch error:', err); });
        }

        function getHeatmapLevelClass(totalCount) {
            if (totalCount >= 1000) return 'lvl-red size-xl';
            if (totalCount >= 800) return 'lvl-orange size-lg';
            if (totalCount >= 600) return 'lvl-yellow size-md';
            if (totalCount >= 400) return 'lvl-green size-sm';
            return 'lvl-blue size-xs';
        }

        function renderSchoolMarkers() {
            schoolOverlays.forEach(ol => ol.setMap(null));
            schoolOverlays = [];

            const schoolNames = Object.keys(schoolMap).filter(name => schoolMap[name].pos !== null);
            schoolNames.forEach(name => {
                const item = schoolMap[name];
                const total = item.total2026;
                const heatClass = getHeatmapLevelClass(total);

                const labelContent = document.createElement('div');
                labelContent.className = `circle-badge ${heatClass}`;
                labelContent.innerHTML = `
                    <span class="badge-count-num">${total.toLocaleString()}명</span>
                    <span class="badge-diff-sub">(🏫)</span>
                `;

                labelContent.onclick = (e) => {
                    if (e) { e.preventDefault(); e.stopPropagation(); }
                    openDetailModal(name);
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

        function renderAcademyMarkers() {
            academyOverlays.forEach(ol => ol.setMap(null));
            academyOverlays = [];

            const addrs = Object.keys(academyMap).filter(a => academyMap[a].pos !== null);
            addrs.forEach(addr => {
                const item = academyMap[addr];
                const labelContent = document.createElement('div');
                labelContent.className = 'academy-badge';
                labelContent.innerHTML = `
                    <span>📚 ${item.address.split(' ').slice(-1)[0]}</span>
                    <span style="font-size:11px; opacity:0.85; background:rgba(0,0,0,0.25); padding:1px 6px; border-radius:10px;">${item.count}개</span>
                `;

                labelContent.onclick = (e) => {
                    if (e) { e.preventDefault(); e.stopPropagation(); }
                    drawRadius3km(item.pos);
                };

                const overlay = new kakao.maps.CustomOverlay({
                    position: item.pos,
                    content: labelContent,
                    yAnchor: 0.5,
                    xAnchor: 0.5,
                    clickable: true,
                    zIndex: Z_INDEX.ACADEMY + item.count
                });

                overlay.setMap(map);
                academyOverlays.push(overlay);
            });
        }

        function renderBranchMarkers() {
            branchOverlays.forEach(ol => ol.setMap(null));
            branchOverlays = [];

            branchDataList.forEach(b => {
                const labelContent = document.createElement('div');
                labelContent.className = 'branch-badge';
                labelContent.innerHTML = `
                    <span>🎓 ${b.name}</span>
                    <span style="font-size:11px; opacity:0.85; background:rgba(0,0,0,0.25); padding:1px 6px; border-radius:10px;">${b.studentCount}명</span>
                `;

                labelContent.onclick = (e) => {
                    if (e) { e.preventDefault(); e.stopPropagation(); }
                    drawRadius3km(b.pos);
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

        function openDetailModal(schoolName) {
            const item = schoolMap[schoolName];
            if (!item) return;

            const modal = document.getElementById('detail-modal');
            document.getElementById('modal-address-name').textContent = item.name;
            document.getElementById('modal-school-code').textContent = `학교코드: ${item.code || 'N/A'}`;

            const v26 = item.total2026;
            const g1 = item.grade1;
            const g2 = item.grade2;
            const g3 = item.grade3;
            const v25 = item.total2025;
            const v24 = item.total2024;

            document.getElementById('val-total').textContent = `${v26.toLocaleString()}명`;
            document.getElementById('val-g1').textContent = `${g1.toLocaleString()}명`;
            document.getElementById('val-g2').textContent = `${g2.toLocaleString()}명`;
            document.getElementById('val-g3').textContent = `${g3.toLocaleString()}명`;

            document.getElementById('val-2024').textContent = `${v24.toLocaleString()}명`;
            document.getElementById('val-2025').textContent = `${v25.toLocaleString()}명`;
            document.getElementById('val-2026').textContent = `${v26.toLocaleString()}명`;

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
                        borderColor: '#ff4757',
                        backgroundColor: 'rgba(255, 71, 87, 0.18)',
                        borderWidth: 3,
                        pointBackgroundColor: '#ff6b81',
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
    });
})();
