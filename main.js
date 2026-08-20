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
        const YOY_CSV_URL = `/api/yoy_data`;         // GID 452840178 : RDB_YoY (전 지점 최신 학생수 & 증감율)

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
        let rdbYoyMap = {};

        let schoolOverlays = [];
        let clusterOverlays = [];
        let academyOverlays = [];
        let branchOverlays = [];
        let apartmentOverlays = [];
        let top10BranchOverlays = [];
        let candidateOverlays = [];
        let trendChart = null;



        const TOP10_GROWTH_BRANCHES = [
            { rank: 1, name: "김포사우지점", lat: 37.6186, lng: 126.7161, count: 301, inc: 119, rate: "65%", note: "김포한강신도시 인근 및 사우동 주거밀집지" },
            { rank: 2, name: "부산명지지점", lat: 35.0945, lng: 128.9056, count: 176, inc: 103, rate: "141%", note: "명지국제신도시 학령인구 폭증 지역" },
            { rank: 3, name: "부산진구지점", lat: 35.1587, lng: 129.0560, count: 210, inc: 89, rate: "74%", note: "도심 재개발 및 신규 대단지 입주 지역" },
            { rank: 4, name: "수원장안지점", lat: 37.3038, lng: 126.9926, count: 408, inc: 74, rate: "22%", note: "장안구 대단지 아파트 밀집 주거지" },
            { rank: 5, name: "위례지점", lat: 37.4724, lng: 127.1436, count: 140, inc: 48, rate: "52%", note: "위례신도시 대단지 학령인구 밀집" },
            { rank: 6, name: "대구침산지점", lat: 35.8885, lng: 128.5898, count: 111, inc: 46, rate: "71%", note: "침산·산격 재개발 신규 아파트 단지" },
            { rank: 7, name: "인천청라지점", lat: 37.5312, lng: 126.6534, count: 137, inc: 39, rate: "40%", note: "청라국제도시 대단지 학원가 입지" },
            { rank: 8, name: "세종보람지점", lat: 36.4789, lng: 127.2894, count: 101, inc: 35, rate: "53%", note: "세종 3생활권 행정·주거 복합 지역" },
            { rank: 9, name: "산본지점", lat: 37.3592, lng: 126.9329, count: 395, inc: 32, rate: "9%", note: "1기 신도시 완성형 학원가 밀집지" },
            { rank: 10, name: "대전관저지점", lat: 36.2974, lng: 127.3321, count: 81, inc: 21, rate: "35%", note: "관저지구 대단지 아파트 밀집지역" }
        ];

        const CANDIDATE_LOCATIONS = [
            // 🏭 1. 반도체 및 소부장 (Semiconductor & Equipment) 배후도시 및 핵심지구
            { name: "김포골드밸리 (양촌·학운 산단)", category: "첨단소부장/광반도체", lat: 37.6420, lng: 126.5820, desc: "9개 산단(190만 평) 1,700여 개 기업 밀집 & 광반도체·소부장 대기업 공급망 핵심 배후" },
            { name: "용인 처인구(원삼·남사)", category: "반도체 배후", lat: 37.1950, lng: 127.2000, desc: "SK하이닉스 반도체 클러스터 & 삼성전자 시스템반도체 국가산단 조성 배후" },
            { name: "경기 오산 세교 2·3지구", category: "반도체 배후", lat: 37.1720, lng: 127.0560, desc: "화성·용인·평택 반도체 벨트 중심 직주근접 대표 배후 도시" },
            { name: "충남 아산 탕정·천안", category: "반도체/자동차", lat: 36.7865, lng: 127.0601, desc: "삼성디스플레이 아산캠퍼스 및 삼성전자 온양·천안 사업장(HBM 생산시설) 배후" },
            { name: "평택 고덕국제신도시", category: "반도체 배후", lat: 37.0270, lng: 127.0505, desc: "삼성전자 평택캠퍼스 배후 신흥 교육 타운" },

            // 🧬 2. 생명과학 및 바이오 (Bio & Life Science) 배후도시
            { name: "인천 송도국제도시", category: "바이오 배후", lat: 37.3850, lng: 126.6500, desc: "글로벌 제약·바이오 기업 및 연구소 집적, 고소득 연구 인력 유입" },
            { name: "충북 청주 오송 (오송생명단지)", category: "바이오 배후", lat: 36.6200, lng: 127.3150, desc: "식약처 등 국책기관 및 제약·바이오 메디컬 허브" },

            // 🚗 3. 자동차 및 모빌리티 (Automobile) 배후도시
            { name: "울산 북구 (송정지구)", category: "자동차 배후", lat: 35.5820, lng: 129.3600, desc: "현대자동차 완성차 공장 배후 직주근접 탄탄한 주거 타운" },
            { name: "화성 남양읍 일대", category: "자동차 배후", lat: 37.2080, lng: 126.8150, desc: "현대기아 남양연구소 및 미래 모빌리티 연구 단지 인접 배후" },

            // 🚢 4. 조선 (Shipbuilding) 배후도시
            { name: "경남 거제 (고현·옥포)", category: "조선 배후", lat: 34.8800, lng: 128.6200, desc: "삼성중공업 및 한화오션 조선 업황 회복 인력 유입 주거 지구" },
            { name: "울산 동구 (화정·서부동)", category: "조선 배후", lat: 35.5000, lng: 129.4200, desc: "HD현대중공업 조선소를 품은 대기업 직주근접 주거 밀집지" },

            // 🛡️ 5. 방위산업 (Defense Industry) 배후도시
            { name: "경남 창원 (성산·진해)", category: "방위산업 배후", lat: 35.2150, lng: 128.6850, desc: "한화에어로스페이스, 현대로템, KAI 등 방산·중공업 대기업 밀집" },
            { name: "대전 유성구 (대덕연구특구)", category: "방위산업 배후", lat: 36.3800, lng: 127.3600, desc: "국방과학연구소(ADD) & 방사청 R&D 핵심 인프라 및 고급 연구 인력" },

            // 1기 신도시
            { name: "분당신도시", category: "1기 신도시", lat: 37.3827, lng: 127.1189, desc: "성남 분당구 - 완성된 인프라 및 명문 학원가 형성 지역" },
            { name: "일산신도시", category: "1기 신도시", lat: 37.6584, lng: 126.7660, desc: "고양 일산동구/서구 - 대규모 인구 및 안정적 교육 수요" },
            { name: "평촌신도시", category: "1기 신도시", lat: 37.3943, lng: 126.9568, desc: "안양 동안구 - 경기 남부 최대 평촌 학원가 보유" },
            { name: "중동신도시", category: "1기 신도시", lat: 37.5030, lng: 126.7660, desc: "부천 원미구 - 수도권 서부 교육·주거 핵심지" },

            // 2기 신도시
            { name: "화성 동탄신도시", category: "2기 신도시", lat: 37.2002, lng: 127.0976, desc: "전국 최상위 학령인구 비율 및 폭발적 학생 유입" },
            { name: "파주 운정신도시", category: "2기 신도시", lat: 37.7516, lng: 126.7450, desc: "GTX-A 역세권 및 신규 대단지 유입 지속" },
            { name: "수원 광교신도시", category: "2기 신도시", lat: 37.2911, lng: 127.0490, desc: "수원 최고 선호 학군 및 고소득 교육 수요층" },
            { name: "인천 검단신도시", category: "2기 신도시", lat: 37.5931, lng: 126.6756, desc: "인천 북부 최대 신도시 및 학령인구 폭증 지역" },
            { name: "양주 옥정·회천지구", category: "2기 신도시", lat: 37.8284, lng: 127.0911, desc: "경기 북부 대표 신도시 입주 지속 지역" },
            { name: "대전 도안신도시", category: "2기 신도시", lat: 36.3262, lng: 127.3400, desc: "대전 유성·서구 연결 핵심 신흥 신도시" },

            // 3기 신도시
            { name: "남양주 왕숙지구", category: "3기 신도시", lat: 37.6650, lng: 127.1650, desc: "수도권 동북부 최대 규모 3기 신도시 (GTX-B 예정)" },
            { name: "하남 교산지구", category: "3기 신도시", lat: 37.5250, lng: 127.2150, desc: "강남 접근성 우수 3기 신도시 핵심 주거지" },
            { name: "인천 계양지구", category: "3기 신도시", lat: 37.5580, lng: 126.7650, desc: "인천 계양·부천 연계 신흥 공공주택지구" },
            { name: "부천 대장지구", category: "3기 신도시", lat: 37.5300, lng: 126.7900, desc: "마곡·계양 연결 첨단 산업 및 주거지" },
            { name: "고양 창릉지구", category: "3기 신도시", lat: 37.6350, lng: 126.8750, desc: "삼송·원흥 연계 고양 서북부 대규모 신도시" },
            { name: "광명시흥지구", category: "3기 신도시", lat: 37.4400, lng: 126.8300, desc: "수도권 서남부 거점 대규모 신도시 예정지" },
            { name: "의왕·군포·안산지구", category: "3기 신도시", lat: 37.3250, lng: 126.9150, desc: "GTX-C 연계 신흥 거점 공공택지지구" },

            // 수도권 주요 택지지구
            { name: "하남 미사강변도시", category: "수도권 택지", lat: 37.5610, lng: 127.1950, desc: "젊은 층 및 학생 비율이 높은 한강변 주거단지" },
            { name: "광명 역세권지구", category: "수도권 택지", lat: 37.4170, lng: 126.8850, desc: "KTX 광명역 역세권 대단지 아파트 밀집" },
            { name: "고양 삼송·원흥지구", category: "수도권 택지", lat: 37.6495, lng: 126.8920, desc: "스타필드 및 대단지 아파트 학령인구" },
            { name: "고양 지축·향동·덕은", category: "수도권 택지", lat: 37.6320, lng: 126.9120, desc: "서울 은평·마포 연접 신규 주거지" },
            { name: "남양주 다산신도시", category: "수도권 택지", lat: 37.6155, lng: 127.1550, desc: "다산 진건·지금지구 대단지 아파트 학원가" },
            { name: "남양주 별내·진접지구", category: "수도권 택지", lat: 37.6450, lng: 127.1180, desc: "4호선·8호선 연장 수혜 주거 지구" },
            { name: "수원 호매실·당수지구", category: "수도권 택지", lat: 37.2710, lng: 126.9530, desc: "수원 서부권 대규모 신규 택지" },
            { name: "화성 봉담지구", category: "수도권 택지", lat: 37.2160, lng: 126.9450, desc: "봉담1·2지구 아파트 밀집지역" },
            { name: "인천 루원시티·검암지구", category: "수도권 택지", lat: 37.5450, lng: 126.6770, desc: "인천 2호선 및 공항철도 역세권 개발지" },

            // 지방 광역시 및 거점 개발지구
            { name: "부산 에코델타시티", category: "지방 거점", lat: 35.1320, lng: 128.9250, desc: "명지지구 연계 서부산 수변 첨단 신도시" },
            { name: "부산 일광·오시리아", category: "지방 거점", lat: 35.2650, lng: 129.2300, desc: "동부산 대표 대단지 신규 주거 타운" },
            { name: "대구 테크노폴리스", category: "지방 거점", lat: 35.6920, lng: 128.4600, desc: "대구 달성군 학령인구 및 대단지 아파트" },
            { name: "대구 국가산단지구", category: "지방 거점", lat: 35.6650, lng: 128.4350, desc: "달성군 현풍·구지 신흥 주거 단지" },
            { name: "대전 유성 상대·학하지구", category: "지방 거점", lat: 36.3450, lng: 127.3250, desc: "대전 유성구 신흥 학원가 형성 후보지" },
            { name: "대전 죽동2지구", category: "지방 거점", lat: 36.3680, lng: 127.3480, desc: "대전 유성 연구/바이오 배후 신규 택지" },
            { name: "세종 반곡동·다정동", category: "지방 거점", lat: 36.4950, lng: 127.2600, desc: "세종시 2·4생활권 학령인구 집중지" },
            { name: "청주 지웰시티·방서지구", category: "지방 거점", lat: 36.6430, lng: 127.4260, desc: "청주 복대동/방서지구 아파트 밀집 학원가" }
        ];

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

        let popupOverlays = [];

        window.clearRadiusOverlay = function () {
            if (clickCircle) { clickCircle.setMap(null); clickCircle = null; }
            if (clickMarker) { clickMarker.setMap(null); clickMarker = null; }
            if (radiusLabel) { radiusLabel.setMap(null); radiusLabel = null; }

            popupOverlays.forEach(ol => ol.setMap(null));
            popupOverlays = [];

            if (startMarker) { startMarker.setMap(null); startMarker = null; }
            if (endMarker) { endMarker.setMap(null); endMarker = null; }
            if (distancePolyline) { distancePolyline.setMap(null); distancePolyline = null; }
            if (distanceBadgeOverlay) { distanceBadgeOverlay.setMap(null); distanceBadgeOverlay = null; }
            startPoint = null;

            closeDetailModal();
        };

        setupUIEvents();
        loadAllGoogleSheetData();
        renderCandidateMarkers();

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
            const chkBranch = document.getElementById('chk-branch');
            const chkCandidate = document.getElementById('chk-candidate');
            const chkHigh = document.getElementById('chk-high');
            const chkMiddle = document.getElementById('chk-middle');
            const chkAcademy = document.getElementById('chk-academy');
            const chkApartment = document.getElementById('chk-apartment');

            if (chkBranch) chkBranch.addEventListener('change', () => renderBranchMarkers());
            if (chkCandidate) chkCandidate.addEventListener('change', () => renderCandidateMarkers());
            if (chkHigh) chkHigh.addEventListener('change', () => renderSchoolMarkers());
            if (chkMiddle) chkMiddle.addEventListener('change', () => renderSchoolMarkers());
            if (chkAcademy) chkAcademy.addEventListener('change', () => renderAcademyMarkers());
            if (chkApartment) chkApartment.addEventListener('change', () => renderApartmentMarkers());

            // 🔍 통합 검색창
            const searchInput = document.getElementById('branch-search');
            const searchResults = document.getElementById('search-results');

            if (searchInput && searchResults) {
                searchInput.addEventListener('input', (e) => {
                    const keyword = e.target.value.trim().toLowerCase();
                    if (!keyword) { searchResults.style.display = 'none'; return; }

                    const matchingCandidates = CANDIDATE_LOCATIONS.filter(c => c.name.toLowerCase().includes(keyword) || c.category.toLowerCase().includes(keyword) || c.desc.toLowerCase().includes(keyword));

                    const matchingSchoolKeys = Object.keys(schoolMap).filter(codeKey => {
                        const item = schoolMap[codeKey];
                        return item.name.toLowerCase().includes(keyword) || item.code.toLowerCase().includes(keyword);
                    });

                    const matchingAcademies = Object.keys(academyMap).filter(addr => addr.toLowerCase().includes(keyword));
                    const matchingBranches = branchDataList.filter(b => b.name.toLowerCase().includes(keyword));
                    const matchingApts = apartmentDataList.filter(apt => apt.address.toLowerCase().includes(keyword));

                    let html = '';
                    matchingBranches.forEach(b => {
                        const key = Object.keys(TOP10_GROWTH_MAP).find(k => b.name.includes(k));
                        const top10Info = key ? TOP10_GROWTH_MAP[key] : null;
                        const icon = top10Info ? `⭐ [Top10 #${top10Info.rank} 지점]` : `🎓 [에이닷지점]`;
                        const badge = top10Info ? ` <span style="color:#f59e0b; font-weight:bold;">(+${top10Info.inc}명 / +${top10Info.rate}%↑)</span>` : '';
                        html += `<div class="search-item" data-type="branch" data-name="${b.name}" data-lat="${b.pos.getLat()}" data-lng="${b.pos.getLng()}">${icon} ${b.name} (학생수: ${b.studentCount}명${badge})</div>`;
                    });
                    matchingCandidates.slice(0, 6).forEach(c => {
                        html += `<div class="search-item" data-type="candidate" data-name="${c.name}" data-lat="${c.lat}" data-lng="${c.lng}">🎯 [${c.category}] ${c.name} (${c.desc.slice(0, 20)}...)</div>`;
                    });
                    matchingSchoolKeys.slice(0, 6).forEach(codeKey => {
                        const item = schoolMap[codeKey];
                        const icon = item.isTop30 ? '[26년 서울대 TOP30]' : (item.isMiddle ? '🏫 [중학교]' : '🏫 [고등학교]');
                        const snuBadge = item.snuAvgCount > 0 ? ` <span style="color:#f59e0b; font-weight:800;">(23년~ 평균 ${item.snuAvgCount}명)</span>` : '';
                        html += `<div class="search-item" data-type="school" data-code="${item.code}">${icon} ${item.name}${snuBadge} (${item.code}) - 총원 ${item.total2026}명</div>`;
                    });
                    matchingAcademies.slice(0, 4).forEach(addr => {
                        const item = academyMap[addr];
                        html += `<div class="search-item" data-type="academy" data-addr="${addr}">📚 [학원가] ${addr} (학원수: ${item.count}개)</div>`;
                    });
                    matchingApts.slice(0, 4).forEach(apt => {
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
                        } else if (type === 'candidate') {
                            const pos = new kakao.maps.LatLng(parseFloat(item.dataset.lat), parseFloat(item.dataset.lng));
                            map.setLevel(6);
                            map.panTo(pos);
                            const cObj = CANDIDATE_LOCATIONS.find(c => c.name === item.dataset.name);
                            if (cObj) showCandidateOverlayPopup(cObj);
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
                renderApartmentMarkers();
            });

            kakao.maps.event.addListener(map, 'idle', () => {
                renderApartmentMarkers();
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
                popupOverlays.push(radiusLabel);
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
                .then(res => {
                    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                    return res.text();
                })
                .then(data => {
                    if (data.trim().startsWith('<!DOCTYPE html') || data.includes('<html')) {
                        console.error('School data response is HTML (Google Sheet non-public or login redirect)');
                        return;
                    }
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
                .then(res => {
                    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                    return res.text();
                })
                .then(data => {
                    if (data.trim().startsWith('<!DOCTYPE html') || data.includes('<html')) {
                        console.error('Academy data response is HTML (Google Sheet non-public or login redirect)');
                        return;
                    }
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

            // 4. 아파트 세대수 데이터 (GID: 642130592)
            fetch(APARTMENT_CSV_URL)
                .then(res => {
                    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                    return res.text();
                })
                .then(data => {
                    if (data.trim().startsWith('<!DOCTYPE html') || data.includes('<html')) {
                        console.error('Apartment data response is HTML (Google Sheet non-public or login redirect)');
                        return;
                    }
                    const rows = data.split('\n').slice(1);
                    apartmentDataList = [];

                    rows.forEach(row => {
                        if (!row.trim()) return;
                        const columns = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
                        if (columns.length < 4) return;

                        const address = (columns[0] || "").replace(/"/g, '').replace(/\ufeff/g, '').trim();
                        const countStr = columns[1] ? columns[1].replace(/"/g, '').replace(/[^0-9]/g, '').trim() : '';
                        const count = parseInt(countStr, 10) || 0;
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
 
            // 3. RDB_YoY (GID 452840178) 먼저 로딩 후 RDB_지점좌표 (GID 211834294) 순차 로딩 (학생수 0명 방지)
            fetch(YOY_CSV_URL)
                .then(res => {
                    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                    return res.text();
                })
                .then(data => {
                    if (data && !data.trim().startsWith('<!DOCTYPE html')) {
                        const rows = data.split('\n').slice(1);
                        rdbYoyMap = {};
                        let rankIndex = 1;

                        rows.forEach(row => {
                            if (!row.trim()) return;
                            const columns = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
                            if (columns.length < 3) return;

                            const name = (columns[0] || "").replace(/"/g, '').replace(/\ufeff/g, '').trim();
                            const yoy = parseInt(columns[1]?.replace(/"/g, '').replace(/[^0-9-]/g, '').trim(), 10) || 0;
                            const count = parseInt(columns[2]?.replace(/"/g, '').replace(/[^0-9-]/g, '').trim(), 10) || 0;
                            const inc = parseInt(columns[3]?.replace(/"/g, '').replace(/[^0-9-]/g, '').trim(), 10) || 0;
                            const rate = parseInt(columns[4]?.replace(/"/g, '').replace(/[^0-9-]/g, '').trim(), 10) || 0;

                            if (name) {
                                rdbYoyMap[name] = {
                                    rank: rankIndex++,
                                    yoy,
                                    count,
                                    inc,
                                    rate
                                };
                            }
                        });
                        console.log(`📊 RDB_YoY CSV data successfully loaded: ${Object.keys(rdbYoyMap).length} branches`);
                    }

                    // YoY 데이터 파싱 완료 후 지점 좌표 CSV 로딩
                    return fetch(BRANCH_CSV_URL);
                })
                .then(res => {
                    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                    return res.text();
                })
                .then(data => {
                    if (data && !data.trim().startsWith('<!DOCTYPE html')) {
                        const rows = data.split('\n').slice(1);
                        branchDataList = [];

                        rows.forEach(row => {
                            if (!row.trim()) return;
                            const columns = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
                            if (columns.length < 3) return;

                            const branchName = (columns[0] || "").replace(/"/g, '').replace(/\ufeff/g, '').trim();
                            const lat = parseFloat(columns[1]?.replace(/"/g, '').replace(/[^0-9.-]/g, '').trim());
                            const lng = parseFloat(columns[2]?.replace(/"/g, '').replace(/[^0-9.-]/g, '').trim());
                            const csvStudentCount = parseInt(columns[3]?.replace(/"/g, '').replace(/[^0-9]/g, '').trim(), 10) || 0;

                            const yoyInfo = getYoYInfo(branchName);
                            const studentCount = (yoyInfo && typeof yoyInfo.count === 'number') ? yoyInfo.count : csvStudentCount;

                            if (branchName && !isNaN(lat) && !isNaN(lng) && lat > 0 && lng > 0) {
                                const pos = new kakao.maps.LatLng(lat, lng);
                                branchDataList.push({
                                    name: branchName,
                                    pos: pos,
                                    studentCount: studentCount
                                });
                            }
                        });

                        console.log(`🎓 Branch CSV data parsed: ${branchDataList.length} branches`);
                        renderBranchMarkers();
                        updateGlobalSummaryBar();
                    }
                })
                .catch(err => { console.error('Branch & YoY CSV fetch error:', err); });
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

        function getYoYInfo(branchName) {
            if (!branchName) return null;
            const clean = branchName.replace(/지점$/, '').replace(/\ufeff/g, '').replace(/"/g, '').trim();

            if (!rdbYoyMap || Object.keys(rdbYoyMap).length === 0) return null;

            if (rdbYoyMap[clean]) return rdbYoyMap[clean];
            if (rdbYoyMap[clean + '지점']) return rdbYoyMap[clean + '지점'];

            const keys = Object.keys(rdbYoyMap);

            const exactKey = keys.find(k => k.replace(/지점$/, '').replace(/\ufeff/g, '').replace(/"/g, '').trim() === clean);
            if (exactKey) return rdbYoyMap[exactKey];

            const prefixKey = keys.find(k => {
                const kClean = k.replace(/지점$/, '').replace(/\ufeff/g, '').replace(/"/g, '').trim();
                return clean.startsWith(kClean) || kClean.startsWith(clean);
            });
            if (prefixKey) return rdbYoyMap[prefixKey];

            return null;
        }

        // 🎓 에이닷지점 마커 렌더링 (Top 10 성장 지점 황금색 & 전체 RDB_YoY 반영)
        function renderBranchMarkers() {
            branchOverlays.forEach(ol => ol.setMap(null));
            branchOverlays = [];

            const isBranchChecked = document.getElementById('chk-branch')?.checked ?? true;
            if (!isBranchChecked) return;

            branchDataList.forEach(b => {
                const yoyInfo = getYoYInfo(b.name);
                const isTop10 = yoyInfo && yoyInfo.rank <= 10;

                const labelContent = document.createElement('div');

                if (isTop10) {
                    labelContent.className = 'top10-branch-overlay';
                    const incSign = yoyInfo.inc >= 0 ? `+${yoyInfo.inc}` : `${yoyInfo.inc}`;
                    const rateSign = yoyInfo.rate >= 0 ? `+${yoyInfo.rate}%↑` : `${yoyInfo.rate}%↓`;
                    labelContent.innerHTML = `
                        <span>🔥 #${yoyInfo.rank} ${b.name}</span>
                        <span style="font-size:11px; opacity:0.95; margin-left:4px; font-weight:700; background:rgba(0,0,0,0.35); padding:1px 6px; border-radius:10px;">${b.studentCount}명 (${incSign}명 / ${rateSign})</span>
                    `;
                } else if (yoyInfo) {
                    labelContent.className = 'branch-badge';
                    const incSign = yoyInfo.inc >= 0 ? `+${yoyInfo.inc}` : `${yoyInfo.inc}`;
                    const rateSign = yoyInfo.rate >= 0 ? `+${yoyInfo.rate}%↑` : `${yoyInfo.rate}%↓`;
                    const rateColor = yoyInfo.inc >= 0 ? '#4ade80' : '#f87171';
                    labelContent.innerHTML = `
                        <span>🎓 ${b.name}</span>
                        <span style="font-size:11px; opacity:0.9; background:rgba(0,0,0,0.3); padding:1px 6px; border-radius:10px;">${b.studentCount}명 <span style="color:${rateColor}; font-weight:600;">(${incSign}명 / ${rateSign})</span></span>
                    `;
                } else {
                    labelContent.className = 'branch-badge';
                    labelContent.innerHTML = `
                        <span>🎓 ${b.name}</span>
                        <span style="font-size:11px; opacity:0.85; background:rgba(0,0,0,0.25); padding:1px 6px; border-radius:10px;">${b.studentCount}명</span>
                    `;
                }

                labelContent.onclick = (e) => {
                    if (e) { e.preventDefault(); e.stopPropagation(); }
                    isMarkerClickHandled = true;
                    showBranchOverlayPopup(b, yoyInfo);
                };

                const overlay = new kakao.maps.CustomOverlay({
                    position: b.pos,
                    content: labelContent,
                    yAnchor: 0.5,
                    xAnchor: 0.5,
                    clickable: true,
                    zIndex: isTop10 ? Z_INDEX.BRANCH + 500 : Z_INDEX.BRANCH
                });

                overlay.setMap(map);
                branchOverlays.push(overlay);
            });
        }

        // 🎯 신규지점 유력 후보지 (1/2/3기 신도시 & 택지지구) 마커 렌더링
        function renderCandidateMarkers() {
            candidateOverlays.forEach(ol => ol.setMap(null));
            candidateOverlays = [];

            const isCandidateChecked = document.getElementById('chk-candidate')?.checked ?? true;
            if (!isCandidateChecked) return;

            CANDIDATE_LOCATIONS.forEach(c => {
                const pos = new kakao.maps.LatLng(c.lat, c.lng);
                const labelContent = document.createElement('div');
                labelContent.className = 'candidate-overlay';
                labelContent.innerHTML = `
                    <span class="cand-tag">${c.category}</span>
                    <span>🎯 ${c.name}</span>
                `;

                labelContent.onclick = (e) => {
                    if (e) { e.preventDefault(); e.stopPropagation(); }
                    isMarkerClickHandled = true;
                    showCandidateOverlayPopup(c);
                };

                const overlay = new kakao.maps.CustomOverlay({
                    position: pos,
                    content: labelContent,
                    yAnchor: 0.5,
                    xAnchor: 0.5,
                    clickable: true,
                    zIndex: Z_INDEX.BRANCH + 400
                });

                overlay.setMap(map);
                candidateOverlays.push(overlay);
            });
        }

        function calculate3kmMetrics(position) {
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

            apartmentDataList.forEach(apt => {
                if (apt && apt.pos) {
                    const dist = getDistance(position, apt.pos);
                    if (dist <= 3000) {
                        totalAptFamilies3km += (apt.count || 0);
                        totalApts3km++;
                    }
                }
            });

            const potentialCustomers = Math.round(totalSchoolStudents3km * 0.05);

            return {
                totalSchools3km,
                totalSchoolStudents3km,
                totalHighSchools3km,
                totalHighSchoolStudents3km,
                totalMiddleSchools3km,
                totalMiddleSchoolStudents3km,
                totalAcademies3km,
                totalAcademyLocs3km,
                totalApts3km,
                totalAptFamilies3km,
                potentialCustomers
            };
        }

        function showCandidateOverlayPopup(c) {
            window.clearRadiusOverlay();

            const pos = new kakao.maps.LatLng(c.lat, c.lng);
            map.panTo(pos);

            clickCircle = new kakao.maps.Circle({
                center: pos,
                radius: 3000,
                strokeWeight: 2,
                strokeColor: '#fbbf24',
                strokeOpacity: 0.85,
                strokeStyle: 'dashed',
                fillColor: '#fbbf24',
                fillOpacity: 0.12,
                zIndex: Z_INDEX.RADIUS - 10
            });
            clickCircle.setMap(map);

            const m = calculate3kmMetrics(pos);

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
                    <span class="rs-title" style="color:#fbbf24;">🎯 [신규지점 유력 후보지] ${c.name}</span>
                </div>
                <div class="rs-address">🏷️ 구분: <b style="color:#fbbf24;">${c.category}</b></div>
                <div class="rs-address" style="margin-top:4px;">💡 입지 및 유입 특징: <b>${c.desc}</b></div>
                
                <div class="rs-header" style="margin-top:10px; border-top:1px solid rgba(255,255,255,0.15); padding-top:8px;">
                    <span class="rs-title" style="color:#60a5fa;">🎯 반경 3km 학교 & 학원가 & 아파트 통합 집계</span>
                </div>
                <div class="rs-grid" style="margin-top:6px;">
                    <div class="rs-item"><label>🏫 반경 3km 총 학교 수 / 학생수</label><value style="color:#ff6b81;">${m.totalSchools3km}개교 (${m.totalSchoolStudents3km.toLocaleString()}명)</value></div>
                    <div class="rs-item" style="padding-left: 16px;"><label>└ 고등학교 수 / 학생수</label><value style="color:#ff7f50; font-size:12.5px;">${m.totalHighSchools3km}개교 (${m.totalHighSchoolStudents3km.toLocaleString()}명)</value></div>
                    <div class="rs-item" style="padding-left: 16px;"><label>└ 중학교 수 / 학생수</label><value style="color:#ff9f43; font-size:12.5px;">${m.totalMiddleSchools3km}개교 (${m.totalMiddleSchoolStudents3km.toLocaleString()}명)</value></div>
                    <div class="rs-item"><label>🎯 잠재 고객수 (총 학생수의 5%)</label><value style="color:#f43f5e; font-weight:800;">${m.potentialCustomers.toLocaleString()}명</value></div>
                    <div class="rs-item"><label>📚 반경 3km 총 학원수</label><value style="color:#1dd1a1;">${m.totalAcademies3km.toLocaleString()}개 (${m.totalAcademyLocs3km}곳)</value></div>
                    <div class="rs-item"><label>🏢 반경 3km 아파트 세대수</label><value style="color:#2ecc71;">${m.totalAptFamilies3km.toLocaleString()}세대 (${m.totalApts3km}곳)</value></div>
                </div>
            `;

            labelContent.querySelector('.rs-header').appendChild(closeBtn);

            const overlay = new kakao.maps.CustomOverlay({
                position: pos,
                content: labelContent,
                yAnchor: 1.25,
                clickable: true,
                zIndex: Z_INDEX.RADIUS + 1000
            });

            overlay.setMap(map);
            popupOverlays.push(overlay);
        }

        // 📚 학원가 원 클릭 전용 팝업
        function showAcademyOverlayPopup(item) {
            window.clearRadiusOverlay();

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
                    <span class="rs-title">📚 학원가 상세 정보</span>
                </div>
                <div class="rs-address">📍 ${item.address}</div>
                <div class="rs-grid">
                    <div class="rs-item"><label>등록 학원 수</label><value style="color:#1dd1a1;">${item.count.toLocaleString()}개</value></div>
                </div>
            `;

            labelContent.querySelector('.rs-header').appendChild(closeBtn);

            const overlay = new kakao.maps.CustomOverlay({
                position: item.pos,
                content: labelContent,
                yAnchor: 1.25,
                clickable: true,
                zIndex: Z_INDEX.RADIUS
            });

            overlay.setMap(map);
            popupOverlays.push(overlay);
        }

        // 🎓 에이닷지점 클릭 시 반경 3km 점선 원 생성 및 반경 3km 내 학생수, 학원수, 학교수 표출
        function showBranchOverlayPopup(b, yoyInfo) {
            window.clearRadiusOverlay();

            if (!yoyInfo) {
                yoyInfo = getYoYInfo(b.name);
            }

            const isTop10 = yoyInfo && yoyInfo.rank <= 10;

            clickCircle = new kakao.maps.Circle({
                center: b.pos,
                radius: 3000,
                strokeWeight: 2,
                strokeColor: isTop10 ? '#f59e0b' : '#7950f2',
                strokeOpacity: 0.85,
                strokeStyle: 'dashed',
                fillColor: isTop10 ? '#f59e0b' : '#7950f2',
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

            let yoyBanner = '';
            if (yoyInfo) {
                const incSign = yoyInfo.inc >= 0 ? `+${yoyInfo.inc}` : `${yoyInfo.inc}`;
                const rateSign = yoyInfo.rate >= 0 ? `+${yoyInfo.rate}%↑` : `${yoyInfo.rate}%↓`;
                const incColor = yoyInfo.inc >= 0 ? '#4ade80' : '#f87171';

                if (isTop10) {
                    yoyBanner = `<div class="rs-address" style="margin-top:4px; color:#f59e0b; font-weight:bold;">🔥 전년대비 성과 Top 10 (순위 #${yoyInfo.rank}): <b style="color:#ef4444;">${incSign}명 (${rateSign})</b> <span style="font-size:11px; font-weight:normal; color:#aaa;">[작년 ${yoyInfo.yoy}명 ➔ 금일 ${b.studentCount}명]</span></div>`;
                } else {
                    yoyBanner = `<div class="rs-address" style="margin-top:4px; color:#ddd;">📈 전년대비 성과 (순위 #${yoyInfo.rank}): <b style="color:${incColor};">${incSign}명 (${rateSign})</b> <span style="font-size:11px; font-weight:normal; color:#aaa;">[작년 ${yoyInfo.yoy}명 ➔ 금일 ${b.studentCount}명]</span></div>`;
                }
            }

            labelContent.innerHTML = `
                <div class="rs-header">
                    <span class="rs-title" style="color:${isTop10 ? '#f59e0b' : '#7950f2'};">${isTop10 ? '🔥' : '🎓'} 에이닷 ${b.name} ${isTop10 ? `(#${yoyInfo.rank} 성장지점)` : ''} (반경 3km 분석)</span>
                </div>
                <div class="rs-address">📍 지점 학생수: <b style="color:${isTop10 ? '#f59e0b' : '#7950f2'};">${b.studentCount.toLocaleString()}명</b> <span style="font-size:11px; font-weight:normal; color:#aaa; margin-left:4px;">(점유율: ${ratioText} ※ 반경 3km 학생수 합계 대비 점유율)</span></div>
                ${yoyBanner}
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
            popupOverlays.push(radiusLabel);
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

        // 🏢 아파트 세대수 마커 렌더링 (화면 뷰포트 영역 실시간 필터링 적용)
        function renderApartmentMarkers() {
            apartmentOverlays.forEach(ol => ol.setMap(null));
            apartmentOverlays = [];

            const isApartmentChecked = document.getElementById('chk-apartment')?.checked ?? false;
            if (!isApartmentChecked) return;

            const bounds = map.getBounds();
            const zoomLevel = map.getLevel();

            apartmentDataList.forEach(apt => {
                if (!apt || !apt.pos) return;
                // 화면 영역(bounds) 내에 있는 아파트 마커만 렌더링하여 렉 없이 즉각 표출
                if (bounds && !bounds.contain(apt.pos)) return;

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
                    zIndex: Z_INDEX.ACADEMY - 50
                });

                overlay.setMap(map);
                apartmentOverlays.push(overlay);
            });
            console.log(`🏢 Rendered ${apartmentOverlays.length} apartment markers in current map bounds.`);
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
            window.clearRadiusOverlay();

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
                    <span class="rs-title" style="color:#2ecc71;">🏢 아파트 상세 정보</span>
                </div>
                <div class="rs-address">📍 ${apt.address}</div>
                <div class="rs-grid">
                    <div class="rs-item"><label>아파트 세대수</label><value style="color:#2ecc71;">${apt.count.toLocaleString()}세대</value></div>
                </div>
            `;

            labelContent.querySelector('.rs-header').appendChild(closeBtn);

            const overlay = new kakao.maps.CustomOverlay({
                position: apt.pos,
                content: labelContent,
                yAnchor: 1.25,
                clickable: true,
                zIndex: Z_INDEX.RADIUS + 1000
            });

            overlay.setMap(map);
            popupOverlays.push(overlay);
        }
    });
})();
