import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

def create_presentation():
    prs = Presentation()
    # Set 16:9 widescreen dimensions
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    # Color Palette
    BG_DARK = RGBColor(15, 23, 42)        # Slate 900 #0f172a
    CARD_BG = RGBColor(30, 41, 59)        # Slate 800 #1e293b
    ACCENT_RED = RGBColor(255, 71, 87)    # Crimson Red #ff4757
    ACCENT_AMBER = RGBColor(245, 158, 11)  # Amber #f59e0b
    ACCENT_BLUE = RGBColor(99, 102, 241)   # Indigo/Blue #6366f1
    TEXT_WHITE = RGBColor(255, 255, 255)  # White
    TEXT_MUTED = RGBColor(148, 163, 184)  # Slate 400

    def add_bg(slide):
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
        bg.fill.solid()
        bg.fill.fore_color.rgb = BG_DARK
        bg.line.fill.background()
        return bg

    def add_header(slide, title_text, category_text="에이닷(A.dot) 신규 출점 전략"):
        # Header bar
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
        p_title.font.size = Pt(26)
        p_title.font.bold = True
        p_title.font.color.rgb = TEXT_WHITE
        p_title.font.name = "Malgun Gothic"

    # ==========================================
    # SLIDE 1: Title Slide
    # ==========================================
    slide1 = prs.slides.add_slide(blank_layout)
    add_bg(slide1)

    # Gradient Card Box
    card1 = slide1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.2), Inches(1.2), Inches(10.933), Inches(5.1))
    card1.fill.solid()
    card1.fill.fore_color.rgb = CARD_BG
    card1.line.color.rgb = ACCENT_RED
    card1.line.width = Pt(2)

    tf1 = card1.text_frame
    tf1.word_wrap = True
    tf1.margin_left = Inches(0.8)
    tf1.margin_top = Inches(1.0)

    p1 = tf1.paragraphs[0]
    p1.text = "🎯 에이닷(A.dot) 신규 출점 전략 발표"
    p1.font.size = Pt(36)
    p1.font.bold = True
    p1.font.color.rgb = ACCENT_RED
    p1.font.name = "Malgun Gothic"

    p2 = tf1.add_paragraph()
    p2.text = "RDB 추천입지 분석 및 강사 구인 리스크(4년제 대학) 최소화 모델"
    p2.font.size = Pt(22)
    p2.font.color.rgb = TEXT_WHITE
    p2.font.name = "Malgun Gothic"
    p2.space_before = Pt(20)

    p3 = tf1.add_paragraph()
    p3.text = "지도 데이터 기반 3km 분석 | 블루오션 독점 입지 | 2026. 08"
    p3.font.size = Pt(14)
    p3.font.color.rgb = TEXT_MUTED
    p3.font.name = "Malgun Gothic"
    p3.space_before = Pt(40)

    # ==========================================
    # SLIDE 2: Executive Summary
    # ==========================================
    slide2 = prs.slides.add_slide(blank_layout)
    add_bg(slide2)
    add_header(slide2, "1. Executive Summary (전략 핵심 요약)")

    box_data = [
        ("🚫 자기잠식 100% 방지", "기존 에이닷 지점 반경 3km 이내 완전 제외 조건 적용\n신규 지점 전용 영토 및 독점 영업권 확보", ACCENT_RED),
        ("🎯 RDB 추천입지 집중 진출", "🔥 초희소형 / ⚡ 세대밀집 / 🖤 메가타겟 3대 모델\n경쟁 학원 희소성 및 대단지 배후 수요 검증 완료", ACCENT_AMBER),
        ("🏛️ 강사 구인 리스크 최소화", "인근 4년제 대학교(🏛️) 입지 연동 분석\n명문대 대학생/대학원생 우수 강사 인력풀 지속 공급", ACCENT_BLUE)
    ]

    for idx, (b_title, b_desc, b_color) in enumerate(box_data):
        left_pos = Inches(0.8 + idx * 3.95)
        card = slide2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left_pos, Inches(1.8), Inches(3.7), Inches(4.8))
        card.fill.solid()
        card.fill.fore_color.rgb = CARD_BG
        card.line.color.rgb = b_color
        card.line.width = Pt(2)

        tf = card.text_frame
        tf.word_wrap = True
        tf.margin_left = Inches(0.3)
        tf.margin_right = Inches(0.3)
        tf.margin_top = Inches(0.5)

        p = tf.paragraphs[0]
        p.text = b_title
        p.font.size = Pt(20)
        p.font.bold = True
        p.font.color.rgb = b_color
        p.font.name = "Malgun Gothic"

        p2 = tf.add_paragraph()
        p2.text = b_desc
        p2.font.size = Pt(14)
        p2.font.color.rgb = TEXT_WHITE
        p2.font.name = "Malgun Gothic"
        p2.space_before = Pt(20)

    # ==========================================
    # SLIDE 3: 🎯 RDB 추천입지 3대 정밀 모델 (강조)
    # ==========================================
    slide3 = prs.slides.add_slide(blank_layout)
    add_bg(slide3)
    add_header(slide3, "2. 🎯 RDB 추천입지 모델 (신규 출점 최우선 입지)")

    types_data = [
        ("🔥 1. 초희소형 (블루오션)", "• 반경 3km 학원수: 50개 미만\n• 반경 3km 아파트: 1.5만 세대 이상\n• 잠정고객수 (5%): 300명 초과\n👉 경쟁 학원이 거의 없어 진출 즉시 시장 독점 가능", ACCENT_RED),
        ("⚡ 2. 세대밀집 (안정성)", "• 반경 3km 아파트: 5.0만 세대 이상\n• 반경 3km 학원수: 100개 미만\n• 잠정고객수 (5%): 400명 이상\n👉 대단지 아파트 초밀집으로 지속적인 학생 유입", ACCENT_AMBER),
        ("🖤 3. 메가타겟 (초대형 배후)", "• 반경 3km 잠정고객수: 700명 이상\n• 중·고등학생 총원: 14,000명 이상\n• 검빨(Black+Red) 전용 테마 적용\n👉 압도적 잠재 인구를 바탕으로 한 대형 거점 입지", RGBColor(255, 107, 129))
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
        p2.font.size = Pt(13.5)
        p2.font.color.rgb = TEXT_WHITE
        p2.font.name = "Malgun Gothic"
        p2.space_before = Pt(16)

    # ==========================================
    # SLIDE 4: 🏛️ 강사 구인 리스크 최소화 모델
    # ==========================================
    slide4 = prs.slides.add_slide(blank_layout)
    add_bg(slide4)
    add_header(slide4, "3. 🏛️ 핵심 지표: 강사 구인 리스크(Instructor Recruitment Risk) 최소화")

    # Left Big Card
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
    p_l1.text = "💡 강사 구인 리스크 논리 정립"
    p_l1.font.size = Pt(20)
    p_l1.font.bold = True
    p_l1.font.color.rgb = ACCENT_BLUE
    p_l1.font.name = "Malgun Gothic"

    p_l2 = tf_l.add_paragraph()
    p_l2.text = (
        "• 기존 '이직 리스크' ➔ '강사 구인 리스크'로 지표 전환\n\n"
        "• 🏛️ 4년제 대학교 근접성의 가치:\n"
        "  - 인근에 4년제 대학교가 입지할 경우 명문 대학생 및 대학원생 파트타임/전임 강사 인력 수급이 매우 용이함.\n\n"
        "  - 학원 개원 초기 가장 큰 병목인 '우수 강사 구인' 리스크를 획기적으로 낮춤.\n\n"
        "  - 우수한 강사진 확보로 수업 질 향상 및 학원 신뢰도 상승."
    )
    p_l2.font.size = Pt(14)
    p_l2.font.color.rgb = TEXT_WHITE
    p_l2.font.name = "Malgun Gothic"
    p_l2.space_before = Pt(14)

    # Right Big Card
    card_r = slide4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.8), Inches(1.8), Inches(5.7), Inches(4.8))
    card_r.fill.solid()
    card_r.fill.fore_color.rgb = CARD_BG
    card_r.line.color.rgb = ACCENT_AMBER
    card_r.line.width = Pt(2)

    tf_r = card_r.text_frame
    tf_r.word_wrap = True
    tf_r.margin_left = Inches(0.4)
    tf_r.margin_top = Inches(0.4)

    p_r1 = tf_r.paragraphs[0]
    p_r1.text = "📊 구인 리스크 최소화의 3대 효과"
    p_r1.font.size = Pt(20)
    p_r1.font.bold = True
    p_r1.font.color.rgb = ACCENT_AMBER
    p_r1.font.name = "Malgun Gothic"

    p_r2 = tf_r.add_paragraph()
    p_r2.text = (
        "1️⃣ 빠른 강사 채용 (Time-to-Hire 감소):\n"
        "    대학생 강사 인력풀이 인근에 상시 형성되어 강사 공백 즉시 메움.\n\n"
        "2️⃣ 강의 학업 수준 우수성 확보:\n"
        "    4년제 주요 대학 인재 수급으로 영어/학습 코칭 질적 우위 점유.\n\n"
        "3️⃣ 학원 운영 지속가능성 극대화:\n"
        "    강사 수급 난항으로 인한 개원 지연 및 휴원 리스크 원천 차단."
    )
    p_r2.font.size = Pt(14)
    p_r2.font.color.rgb = TEXT_WHITE
    p_r2.font.name = "Malgun Gothic"
    p_r2.space_before = Pt(14)

    # ==========================================
    # SLIDE 5: 📊 4중 정밀 평가 입체 프로세스
    # ==========================================
    slide5 = prs.slides.add_slide(blank_layout)
    add_bg(slide5)
    add_header(slide5, "4. 📊 데이터 기반 4중 출점 평가 프로세스")

    steps = [
        ("STEP 1", "🎯 RDB 추천입지 추출", "기존 지점 3km 이격 + 3대 유형 자동 분류", ACCENT_RED),
        ("STEP 2", "🏛️ 강사 구인 평가", "인근 4년제 대학교 근접성 및 인력풀 확인", ACCENT_BLUE),
        ("STEP 3", "🏫 학생수 추이 분석", "2024~2026년 3개년 학교 학생수 모멘텀 검증", ACCENT_AMBER),
        ("STEP 4", "🏢 배후 수요 확정", "반경 3km 아파트 세대수 및 경쟁 학원가 밀집도 측정", RGBColor(46, 204, 113))
    ]

    for idx, (s_step, s_title, s_desc, s_color) in enumerate(steps):
        left_pos = Inches(0.8 + idx * 2.95)
        card = slide5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left_pos, Inches(2.2), Inches(2.7), Inches(4.2))
        card.fill.solid()
        card.fill.fore_color.rgb = CARD_BG
        card.line.color.rgb = s_color
        card.line.width = Pt(2)

        tf = card.text_frame
        tf.word_wrap = True
        tf.margin_left = Inches(0.2)
        tf.margin_right = Inches(0.2)
        tf.margin_top = Inches(0.4)

        p = tf.paragraphs[0]
        p.text = s_step
        p.font.size = Pt(14)
        p.font.bold = True
        p.font.color.rgb = s_color
        p.font.name = "Malgun Gothic"

        p2 = tf.add_paragraph()
        p2.text = s_title
        p2.font.size = Pt(17)
        p2.font.bold = True
        p2.font.color.rgb = TEXT_WHITE
        p2.font.name = "Malgun Gothic"
        p2.space_before = Pt(10)

        p3 = tf.add_paragraph()
        p3.text = s_desc
        p3.font.size = Pt(13)
        p3.font.color.rgb = TEXT_MUTED
        p3.font.name = "Malgun Gothic"
        p3.space_before = Pt(16)

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
