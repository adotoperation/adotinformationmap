import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

def create_presentation():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    # Color Palette
    BG_DARK = RGBColor(15, 23, 42)        # Slate 900 #0f172a
    CARD_BG = RGBColor(30, 41, 59)        # Slate 800 #1e293b
    ACCENT_RED = RGBColor(255, 71, 87)    # Crimson Red #ff4757
    ACCENT_AMBER = RGBColor(245, 158, 11)  # Amber #f59e0b
    ACCENT_BLUE = RGBColor(99, 102, 241)   # Indigo/Blue #6366f1
    ACCENT_GREEN = RGBColor(46, 204, 113)  # Emerald Green #2ecc71
    TEXT_WHITE = RGBColor(255, 255, 255)  # White
    TEXT_MUTED = RGBColor(148, 163, 184)  # Slate 400

    def add_bg(slide):
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
        bg.fill.solid()
        bg.fill.fore_color.rgb = BG_DARK
        bg.line.fill.background()
        return bg

    def add_header(slide, title_text, category_text="에이닷(A.dot) 영어학원 성장의 3대 필수 조건"):
        tx_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(11.7), Inches(1.1))
        tf = tx_box.text_frame
        tf.word_wrap = True
        
        p_cat = tf.paragraphs[0]
        p_cat.text = category_text.upper()
        p_cat.font.size = Pt(12)
        p_cat.font.bold = True
        p_cat.font.color.rgb = ACCENT_RED
        p_cat.font.name = "Malgun Gothic"

        p_title = tf.add_paragraph()
        p_title.text = title_text
        p_title.font.size = Pt(25)
        p_title.font.bold = True
        p_title.font.color.rgb = TEXT_WHITE
        p_title.font.name = "Malgun Gothic"

    # ==========================================
    # SLIDE 1: Title Slide
    # ==========================================
    slide1 = prs.slides.add_slide(blank_layout)
    add_bg(slide1)

    card1 = slide1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.2), Inches(1.2), Inches(10.933), Inches(5.1))
    card1.fill.solid()
    card1.fill.fore_color.rgb = CARD_BG
    card1.line.color.rgb = ACCENT_RED
    card1.line.width = Pt(2)

    tf1 = card1.text_frame
    tf1.word_wrap = True
    tf1.margin_left = Inches(0.8)
    tf1.margin_top = Inches(0.8)

    p1 = tf1.paragraphs[0]
    p1.text = "🎯 추천입지 유형별 맞춤 전략 & 최적 입지 산출 모델"
    p1.font.size = Pt(30)
    p1.font.bold = True
    p1.font.color.rgb = ACCENT_RED
    p1.font.name = "Malgun Gothic"

    p2 = tf1.add_paragraph()
    p2.text = "콘텐츠 + 우수 강사진 + 상권 분석 웹앱 (학원수 추이 / 아파트 매매가 구매력 / 대학 입결 데이터)"
    p2.font.size = Pt(18)
    p2.font.bold = True
    p2.font.color.rgb = TEXT_WHITE
    p2.font.name = "Malgun Gothic"
    p2.space_before = Pt(18)

    p3 = tf1.add_paragraph()
    p3.text = "에이닷 영어학원 지속 성장 & 신규 출점 시뮬레이션 시스템 보고서 | 2026. 08"
    p3.font.size = Pt(13.5)
    p3.font.color.rgb = TEXT_MUTED
    p3.font.name = "Malgun Gothic"
    p3.space_before = Pt(40)

    # ==========================================
    # SLIDE 2: 학원 성장의 3대 필수 조건
    # ==========================================
    slide2 = prs.slides.add_slide(blank_layout)
    add_bg(slide2)
    add_header(slide2, "1. 학원 성장의 3대 필수 조건 (3 Pillars of Growth)")

    pillars = [
        ("📚 1. 콘텐츠", "• 커리큘럼 및 교재\n• 자체 학습 시스템\n• 1:1 맞춤형 코칭 프로그램\n\n👉 에이닷 독자 브랜드 가치", ACCENT_AMBER),
        ("🎓 2. 우수 강사진", "• 학생 지도 및 강의력\n• 동기부여 및 학습 관리\n• 4년제 대학 인재풀 연동\n\n👉 성과 창출의 핵심 동력", ACCENT_BLUE),
        ("🗺️ 3. 상권 분석", "• [핵심! 이 웹앱이 필요한 이유]\n• 수강생/잠재고객/학원수 정밀 분석\n• 서울대 TOP30 및 학구열 판정\n\n👉 실패 없는 출점의 완성", ACCENT_RED)
    ]

    for idx, (p_title, p_desc, p_color) in enumerate(pillars):
        left_pos = Inches(0.8 + idx * 3.95)
        card = slide2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left_pos, Inches(1.8), Inches(3.7), Inches(4.8))
        card.fill.solid()
        card.fill.fore_color.rgb = CARD_BG
        card.line.color.rgb = p_color
        card.line.width = Pt(2)

        tf = card.text_frame
        tf.word_wrap = True
        tf.margin_left = Inches(0.3)
        tf.margin_right = Inches(0.3)
        tf.margin_top = Inches(0.4)

        p = tf.paragraphs[0]
        p.text = p_title
        p.font.size = Pt(18)
        p.font.bold = True
        p.font.color.rgb = p_color
        p.font.name = "Malgun Gothic"

        p2 = tf.add_paragraph()
        p2.text = p_desc
        p2.font.size = Pt(14)
        p2.font.color.rgb = TEXT_WHITE
        p2.font.name = "Malgun Gothic"
        p2.space_before = Pt(16)

    # ==========================================
    # SLIDE 3: 🎯 추천입지 3개 유형별 전략적 진출 (한눈에 파악)
    # ==========================================
    slide3 = prs.slides.add_slide(blank_layout)
    add_bg(slide3)
    add_header(slide3, "2. 🎯 추천입지 3개 유형 분류 & 맞춤형 전략 진출 (한눈에 파악)")

    types_data = [
        ("🔥 1. 초희소형 (블루오션 독점)", "• 학원수 < 50개 / 아파트 > 1.5만 세대\n• 잠정고객 > 300명 (중·고등 6,000명+)\n👉 전략: 경쟁 부재 지역 우선 진출 ➔ 빠르게 시장 점유율 1위 독점", ACCENT_RED),
        ("⚡ 2. 세대밀집 (안정적 거점)", "• 아파트 > 5.0만 세대 초밀집 타운\n• 학원수 < 100개 / 잠정고객 > 400명\n👉 전략: 풍부한 배후 세대 바탕 ➔ 장기 안정적 고수익 거점 확보", ACCENT_AMBER),
        ("🖤 3. 메가타겟 (플래그십 거점)", "• 잠정고객 > 700명 (중·고등 1.4만명+)\n• 검빨(Black+Red) 전용 글로우 테마\n👉 전략: 초대형 학령 인구 상권 ➔ 브랜드 대형 플래그십 출점", RGBColor(255, 107, 129))
    ]

    for idx, (t_title, t_desc, t_color) in enumerate(types_data):
        left_pos = Inches(0.8 + idx * 3.95)
        card = slide3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left_pos, Inches(1.8), Inches(3.7), Inches(4.8))
        card.fill.solid()
        card.fill.fore_color.rgb = CARD_BG
        card.line.color.rgb = t_color
        card.line.width = Pt(2)

        tf = card.text_frame
        tf.word_wrap = True
        tf.margin_left = Inches(0.3)
        tf.margin_right = Inches(0.3)
        tf.margin_top = Inches(0.4)

        p = tf.paragraphs[0]
        p.text = t_title
        p.font.size = Pt(17.5)
        p.font.bold = True
        p.font.color.rgb = t_color
        p.font.name = "Malgun Gothic"

        p2 = tf.add_paragraph()
        p2.text = t_desc
        p2.font.size = Pt(13.5)
        p2.font.color.rgb = TEXT_WHITE
        p2.font.name = "Malgun Gothic"
        p2.space_before = Pt(16)

    # ==========================================
    # SLIDE 4: 서울대 TOP30 & 4년제 대학 (학구열 + 강사 수급)
    # ==========================================
    slide4 = prs.slides.add_slide(blank_layout)
    add_bg(slide4)
    add_header(slide4, "3. ⭐ 서울대 TOP30 & 🏛️ 4년제 대학 (학구열 + 강사 수급)")

    card_l = slide4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.8), Inches(5.6), Inches(4.8))
    card_l.fill.solid()
    card_l.fill.fore_color.rgb = CARD_BG
    card_l.line.color.rgb = ACCENT_AMBER
    card_l.line.width = Pt(2)

    tf_l = card_l.text_frame
    tf_l.word_wrap = True
    tf_l.margin_left = Inches(0.4)
    tf_l.margin_top = Inches(0.4)

    p_l1 = tf_l.paragraphs[0]
    p_l1.text = "⭐ 서울대 입결 TOP 30 시각화"
    p_l1.font.size = Pt(19)
    p_l1.font.bold = True
    p_l1.font.color.rgb = ACCENT_AMBER
    p_l1.font.name = "Malgun Gothic"

    p_l2 = tf_l.add_paragraph()
    p_l2.text = (
        "• 2026년 서울대 합격자 상위 30개 고등학교 마커 배치\n\n"
        "• 직관적 학구열 파악:\n"
        "  - 지도에서 TOP 30 고교 위치를 한눈에 파악하여 해당 상권의 학구열 수준 판정.\n\n"
        "  - 학구열이 높은 상권일수록 에이닷 1:1 고난도 코칭 수요가 폭발하며 수강생 LTV 극대화."
    )
    p_l2.font.size = Pt(13)
    p_l2.font.color.rgb = TEXT_WHITE
    p_l2.font.name = "Malgun Gothic"
    p_l2.space_before = Pt(12)

    card_r = slide4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.8), Inches(1.8), Inches(5.7), Inches(4.8))
    card_r.fill.solid()
    card_r.fill.fore_color.rgb = CARD_BG
    card_r.line.color.rgb = ACCENT_BLUE
    card_r.line.width = Pt(2)

    tf_r = card_r.text_frame
    tf_r.word_wrap = True
    tf_r.margin_left = Inches(0.4)
    tf_r.margin_top = Inches(0.4)

    p_r1 = tf_r.paragraphs[0]
    p_r1.text = "🏛️ 4년제 대학교 2대 핵심 가치"
    p_r1.font.size = Pt(19)
    p_r1.font.bold = True
    p_r1.font.color.rgb = ACCENT_BLUE
    p_r1.font.name = "Malgun Gothic"

    p_r2 = tf_r.add_paragraph()
    p_r2.text = (
        "1️⃣ 지역 전체의 지적 분위기 & 학구열 측정 지표\n\n"
        "2️⃣ 명문 대학생/대학원생 강사 수급 용이성:\n"
        "    - 가까운 인근에서 우수 강사를 빠르게 구인.\n"
        "    - 개원 초기 '강사 구인 리스크'를 제로화하여 지점 운영의 안정성 및 매출 성장 보장."
    )
    p_r2.font.size = Pt(13)
    p_r2.font.color.rgb = TEXT_WHITE
    p_r2.font.name = "Malgun Gothic"
    p_r2.space_before = Pt(12)

    # ==========================================
    # SLIDE 5: 🚀 미래 데이터 고도화 로드맵 (최적 입지 조건 산출)
    # ==========================================
    slide5 = prs.slides.add_slide(blank_layout)
    add_bg(slide5)
    add_header(slide5, "4. 🚀 미래 고도화 로드맵: 에이닷 최적 입지조건 자동 산출")

    features = [
        ("📈 3개년 학원수 추이", "학원 시장의 성숙도 및 포화 모멘텀 분석", ACCENT_RED),
        ("🏢 아파트 매매가 데이터", "지역 가구 소득 수준 및 교육비 구매력(Purchasing Power) 파악", ACCENT_AMBER),
        ("🎓 4년제 대학 수시/수능 입결", "대학 입결 수준 기반 학구열 및 강사 품질 정밀 평가", ACCENT_BLUE),
        ("💡 최적 입지조건 자동 산출", "빅데이터 결합으로 '에이닷 입지 AI Score' 산출하여 1순위 추천", ACCENT_GREEN)
    ]

    for idx, (f_title, f_desc, f_color) in enumerate(features):
        row = idx // 2
        col = idx % 2
        left_pos = Inches(0.8 + col * 5.95)
        top_pos = Inches(1.8 + row * 2.5)

        card = slide5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left_pos, top_pos, Inches(5.6), Inches(2.2))
        card.fill.solid()
        card.fill.fore_color.rgb = CARD_BG
        card.line.color.rgb = f_color
        card.line.width = Pt(2)

        tf = card.text_frame
        tf.word_wrap = True
        tf.margin_left = Inches(0.3)
        tf.margin_top = Inches(0.3)

        p = tf.paragraphs[0]
        p.text = f_title
        p.font.size = Pt(18)
        p.font.bold = True
        p.font.color.rgb = f_color
        p.font.name = "Malgun Gothic"

        p2 = tf.add_paragraph()
        p2.text = f_desc
        p2.font.size = Pt(13.5)
        p2.font.color.rgb = TEXT_WHITE
        p2.font.name = "Malgun Gothic"
        p2.space_before = Pt(10)

    # ==========================================
    # SLIDE 6: 경영진 최종 결론 & 비즈니스 제언
    # ==========================================
    slide6 = prs.slides.add_slide(blank_layout)
    add_bg(slide6)
    add_header(slide6, "5. 경영진 최종 결론 & 비즈니스 임팩트 제언")

    card_fin = slide6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.8), Inches(11.733), Inches(4.8))
    card_fin.fill.solid()
    card_fin.fill.fore_color.rgb = CARD_BG
    card_fin.line.color.rgb = ACCENT_RED
    card_fin.line.width = Pt(2)

    tf_fin = card_fin.text_frame
    tf_fin.word_wrap = True
    tf_fin.margin_left = Inches(0.5)
    tf_fin.margin_top = Inches(0.4)

    p_f1 = tf_fin.paragraphs[0]
    p_f1.text = "💡 본 웹앱은 에이닷 성장의 핵심 축인 '상권 분석'의 표준 시뮬레이터입니다."
    p_f1.font.size = Pt(20)
    p_f1.font.bold = True
    p_f1.font.color.rgb = ACCENT_RED
    p_f1.font.name = "Malgun Gothic"

    p_f2 = tf_fin.add_paragraph()
    p_f2.text = (
        "• 추천입지를 3개 유형(🔥초희소형/⚡세대밀집/🖤메가타겟)으로 자동 분류하여 한눈에 파악하고 전략적 진출 가능.\n\n"
        "• ⭐ 서울대 TOP30 및 🏛️ 4년제 대학 입지로 '학구열'과 '강사 구인 용이성'을 완벽하게 검증.\n\n"
        "• 향후 3개년 학원수 추이 + 아파트 매매가(구매력) + 대학 수시/수능 입결 빅데이터 고도화로 최적 입지조건을 자동 산출하여 에이닷의 전국 1위 기하급수적 성장을 견인할 것을 제언합니다."
    )
    p_f2.font.size = Pt(14)
    p_f2.font.color.rgb = TEXT_WHITE
    p_f2.font.name = "Malgun Gothic"
    p_f2.space_before = Pt(16)

    # Save presentations with fallback if open in PowerPoint
    out1_a = r"C:\Users\PC-B-088\.gemini\antigravity\scratch\adotinformationmap\adot_expansion_presentation.pptx"
    out1_b = r"C:\Users\PC-B-088\.gemini\antigravity\scratch\adotinformationmap\adot_expansion_presentation_v2.pptx"
    out2_a = r"C:\Users\PC-B-088\.gemini\antigravity\brain\0af80624-cd74-465c-8de5-45860e05e8b4\adot_expansion_presentation.pptx"
    out2_b = r"C:\Users\PC-B-088\.gemini\antigravity\brain\0af80624-cd74-465c-8de5-45860e05e8b4\adot_expansion_presentation_v2.pptx"
    
    try:
        prs.save(out1_a)
        target1 = out1_a
    except Exception:
        prs.save(out1_b)
        target1 = out1_b

    try:
        prs.save(out2_a)
        target2 = out2_a
    except Exception:
        prs.save(out2_b)
        target2 = out2_b

    print("PowerPoint presentation created successfully:")
    print("   - Project path:", target1)
    print("   - Artifact path:", target2)

if __name__ == "__main__":
    create_presentation()
