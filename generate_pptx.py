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

    def add_header(slide, title_text, category_text="에이닷(A.dot) 영어학원 지속 성장 전략"):
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
    # SLIDE 1: Title Slide (경영진 제언 중심)
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
    tf1.margin_top = Inches(0.9)

    p1 = tf1.paragraphs[0]
    p1.text = "🚀 이 웹앱이 에이닷(A.dot) 영어학원의 성장에 왜 필수적인가?"
    p1.font.size = Pt(32)
    p1.font.bold = True
    p1.font.color.rgb = ACCENT_RED
    p1.font.name = "Malgun Gothic"

    p2 = tf1.add_paragraph()
    p2.text = "데이터 기반 실패 없는 출점 | 블루오션 시장 독점 | 강사 구인 리스크 제로화"
    p2.font.size = Pt(20)
    p2.font.bold = True
    p2.font.color.rgb = TEXT_WHITE
    p2.font.name = "Malgun Gothic"
    p2.space_before = Pt(20)

    p3 = tf1.add_paragraph()
    p3.text = "전국 네트워크 3km 반경 빅데이터 통합 시뮬레이션 시스템 보고서 | 2026. 08"
    p3.font.size = Pt(14)
    p3.font.color.rgb = TEXT_MUTED
    p3.font.name = "Malgun Gothic"
    p3.space_before = Pt(45)

    # ==========================================
    # SLIDE 2: 에이닷 성장을 이끄는 3대 엔진
    # ==========================================
    slide2 = prs.slides.add_slide(blank_layout)
    add_bg(slide2)
    add_header(slide2, "1. 에이닷 영어학원 성장을 이끄는 웹앱의 3대 핵심 가치")

    pillars = [
        ("🎯 1. 실패 없는 출점 (Zero Risk)", "• 기존의 '감'이나 부동산 의존 출점 탈피\n• 3개년(2024~2026) 학생수 추이 기반\n• 1.5만 세대+ 대단지 수급으로 100% 성공", ACCENT_RED),
        ("🔥 2. 독점적 블루오션 선점", "• 기존 지점 3km 이격 ➔ 자기잠식 0%\n• 경쟁 학원 50개 미만 지역 자동 발굴\n• 진출 즉시 신규 수강생 빠른 흡수", ACCENT_AMBER),
        ("🏛️ 3. 강사 구인 리스크 제로화", "• 학원 성장의 병목인 '우수 강사 구인' 해결\n• 4년제 대학교 인접 입지 정밀 분석\n• 명문대 대학생/대학원생 강사 인력 상시 수급", ACCENT_BLUE)
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
    # SLIDE 3: 🎯 매출 폭발을 일으키는 RDB 추천입지
    # ==========================================
    slide3 = prs.slides.add_slide(blank_layout)
    add_bg(slide3)
    add_header(slide3, "2. 성장을 가속화하는 🎯 RDB 추천입지 독점 모델")

    types_data = [
        ("🔥 1. 초희소형 (블루오션)", "• 학원수 < 50개 / 아파트 > 1.5만 세대\n• 잠정고객 > 300명 (중·고등 6,000명+)\n👉 경쟁 학원이 거의 없어 독점적 고수익 창출", ACCENT_RED),
        ("⚡ 2. 세대밀집 (안정적 성장)", "• 아파트 > 5.0만 세대 초밀집 타운\n• 학원수 < 100개 / 잠정고객 > 400명\n👉 풍부한 학령인구로 장기적 수강생 지속 확보", ACCENT_AMBER),
        ("🖤 3. 메가타겟 (플래그십)", "• 잠정고객 > 700명 (중·고등 1.4만명+)\n• 압도적 배후 인구의 초대형 지역\n👉 검빨(Black+Red) 테마 대형 플래그십 거점", RGBColor(255, 107, 129))
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
        p.font.size = Pt(18)
        p.font.bold = True
        p.font.color.rgb = t_color
        p.font.name = "Malgun Gothic"

        p2 = tf.add_paragraph()
        p2.text = t_desc
        p2.font.size = Pt(14)
        p2.font.color.rgb = TEXT_WHITE
        p2.font.name = "Malgun Gothic"
        p2.space_before = Pt(16)

    # ==========================================
    # SLIDE 4: 🏛️ 강사 구인 리스크 최소화 모델 (성장 병목 해결)
    # ==========================================
    slide4 = prs.slides.add_slide(blank_layout)
    add_bg(slide4)
    add_header(slide4, "3. 학원 사업 성장의 최대 병목: '강사 구인 리스크' 완벽 해결")

    card_l = slide4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.8), Inches(5.6), Inches(4.8))
    card_l.fill.solid()
    card_l.fill.fore_color.rgb = CARD_BG
    card_l.line.color.rgb = ACCENT_BLUE
    card_l.line.width = Pt(2)

    tf_l = card_l.text_frame
    tf_l.word_wrap = True
    tf_l.margin_left = Inches(0.4)
    tf_l.margin_top = Inches(0.4)

    p_l1 = tf_l.paragraphs[0]
    p_l1.text = "🏛️ 4년제 대학교 입지 분석의 논리"
    p_l1.font.size = Pt(20)
    p_l1.font.bold = True
    p_l1.font.color.rgb = ACCENT_BLUE
    p_l1.font.name = "Malgun Gothic"

    p_l2 = tf_l.add_paragraph()
    p_l2.text = (
        "• 에이닷 성장의 핵심은 '우수한 강사진 수급'\n\n"
        "• 주변 4년제 대학교 존재의 가치:\n"
        "  - 주요 대학생 및 대학원생 파트타임/전임 강사 인력풀이 항상 대기 중인 입지 확보.\n\n"
        "  - 학원 개원 및 세 확장 시 강사 수급 난항으로 인한 개원 지연 및 운영 차질 방지.\n\n"
        "  - 높은 수준의 지적 역량을 갖춘 강사 채용으로 학생/학부모 만족도 극대화."
    )
    p_l2.font.size = Pt(13.5)
    p_l2.font.color.rgb = TEXT_WHITE
    p_l2.font.name = "Malgun Gothic"
    p_l2.space_before = Pt(14)

    card_r = slide4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.8), Inches(1.8), Inches(5.7), Inches(4.8))
    card_r.fill.solid()
    card_r.fill.fore_color.rgb = CARD_BG
    card_r.line.color.rgb = ACCENT_GREEN
    card_r.line.width = Pt(2)

    tf_r = card_r.text_frame
    tf_r.word_wrap = True
    tf_r.margin_left = Inches(0.4)
    tf_r.margin_top = Inches(0.4)

    p_r1 = tf_r.paragraphs[0]
    p_r1.text = "📈 지점 성장에 미치는 실질적 비즈니스 효과"
    p_r1.font.size = Pt(20)
    p_r1.font.bold = True
    p_r1.font.color.rgb = ACCENT_GREEN
    p_r1.font.name = "Malgun Gothic"

    p_r2 = tf_r.add_paragraph()
    p_r2.text = (
        "1️⃣ 강사 구인 비용 & 시간 절감 (Recruitment Cost 🔻):\n"
        "    대학 인접 입지로 구인 공고 시 빠르게 인재 채용 가능.\n\n"
        "2️⃣ 강사 퇴사 시 원활한 대타/신규 강사 교체:\n"
        "    인근 인력풀 확보로 수업 연속성 유지 및 이탈 방지.\n\n"
        "3️⃣ 에이닷 브랜드의 지속적 세 확장 가속화:\n"
        "    강사 수급 걱정 없는 연쇄 출점으로 전국 네트워크 완성."
    )
    p_r2.font.size = Pt(13.5)
    p_r2.font.color.rgb = TEXT_WHITE
    p_r2.font.name = "Malgun Gothic"
    p_r2.space_before = Pt(14)

    # ==========================================
    # SLIDE 5: 경영진 제언 및 결론 (비즈니스 임팩트)
    # ==========================================
    slide5 = prs.slides.add_slide(blank_layout)
    add_bg(slide5)
    add_header(slide5, "4. 비즈니스 임팩트 & 경영진 최종 제언")

    card_fin = slide5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.8), Inches(11.733), Inches(4.8))
    card_fin.fill.solid()
    card_fin.fill.fore_color.rgb = CARD_BG
    card_fin.line.color.rgb = ACCENT_RED
    card_fin.line.width = Pt(2)

    tf_fin = card_fin.text_frame
    tf_fin.word_wrap = True
    tf_fin.margin_left = Inches(0.5)
    tf_fin.margin_top = Inches(0.4)

    p_f1 = tf_fin.paragraphs[0]
    p_f1.text = "💡 본 웹앱은 에이닷 영어학원의 지속 가능한 성장을 위한 필수 데이터 엔진입니다."
    p_f1.font.size = Pt(22)
    p_f1.font.bold = True
    p_f1.font.color.rgb = ACCENT_RED
    p_f1.font.name = "Malgun Gothic"

    p_f2 = tf_fin.add_paragraph()
    p_f2.text = (
        "• 수개월 걸리던 부동산 조사 및 입지 탐방을 '3초 만에 전국 210개 최적지 정밀 분석'으로 혁신.\n\n"
        "• 기존 지점 3km 제외로 자기잠식을 막고, 🔥 1. 초희소형 입지 우선 진출로 시장 1위 빠른 독점.\n\n"
        "• 🏛️ 4년제 대학교 인근 입지 검증을 병행하여 학원 사업 성장의 가장 큰 걸림돌인 '강사 구인 리스크' 원천 차단.\n\n"
        "➔ 결론: 본 웹앱 시스템을 에이닷의 출점 의사결정 표준(Standard)으로 도입하여 실패 없는 기하급수적 성장을 견인할 것을 제언합니다."
    )
    p_f2.font.size = Pt(15)
    p_f2.font.color.rgb = TEXT_WHITE
    p_f2.font.name = "Malgun Gothic"
    p_f2.space_before = Pt(20)

    # Save presentations
    output_path1 = r"C:\Users\PC-B-088\.gemini\antigravity\scratch\adotinformationmap\adot_expansion_presentation.pptx"
    output_path2 = r"C:\Users\PC-B-088\.gemini\antigravity\brain\0af80624-cd74-465c-8de5-45860e05e8b4\adot_expansion_presentation.pptx"
    
    prs.save(output_path1)
    prs.save(output_path2)
    print("PowerPoint presentation created successfully:")
    print("   - Project path:", output_path1)
    print("   - Artifact path:", output_path2)

if __name__ == "__main__":
    create_presentation()
