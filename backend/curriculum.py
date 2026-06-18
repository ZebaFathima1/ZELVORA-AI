"""
Mindora AI — Grade 6-12 curriculum structure.
Each lesson is just a stub. AI generates the actual learning content on demand.
"""

SUBJECTS = {
    "math": {"name": "Mathematics", "color": "#4F46E5", "icon": "Calculator"},
    "science": {"name": "Science", "color": "#06B6D4", "icon": "FlaskConical"},
    "english": {"name": "English", "color": "#8B5CF6", "icon": "BookOpen"},
    "coding": {"name": "Coding", "color": "#EC4899", "icon": "Code2"},
}

# grade -> subject -> [lessons]
CURRICULUM = {
    6: {
        "math": [
            {"slug": "g6m-fractions", "title": "Fractions That Make Sense", "concept": "Fractions as parts of a whole", "hook": "pizza slices"},
            {"slug": "g6m-decimals", "title": "Decimals Without Fear", "concept": "Place value beyond the ones column", "hook": "money & measuring tape"},
            {"slug": "g6m-ratios", "title": "Ratios in the Kitchen", "concept": "Comparing quantities with ratios", "hook": "lemonade recipes"},
            {"slug": "g6m-negative", "title": "The Number Line Goes Both Ways", "concept": "Negative numbers", "hook": "thermometer & elevators"},
            {"slug": "g6m-area", "title": "Shapes That Cover Floors", "concept": "Area of rectangles & triangles", "hook": "tiling a room"},
            {"slug": "g6m-stats", "title": "What Numbers Whisper", "concept": "Mean, median, mode", "hook": "class test scores"},
        ],
        "science": [
            {"slug": "g6s-cells", "title": "The Tiny Cities Inside You", "concept": "Cells as building blocks of life", "hook": "city analogy"},
            {"slug": "g6s-ecosystems", "title": "Who Eats Who", "concept": "Food chains & ecosystems", "hook": "forest detective story"},
            {"slug": "g6s-states", "title": "Solid, Liquid, Gas, Magic", "concept": "States of matter", "hook": "ice → water → steam"},
            {"slug": "g6s-weather", "title": "Why Clouds Cry", "concept": "Water cycle & weather", "hook": "a raindrop's journey"},
            {"slug": "g6s-earth", "title": "Earth's Hidden Layers", "concept": "Structure of the Earth", "hook": "cutting an apple"},
        ],
        "english": [
            {"slug": "g6e-nouns", "title": "Words That Name Worlds", "concept": "Nouns & noun phrases", "hook": "show, don't tell"},
            {"slug": "g6e-verbs", "title": "Verbs Make Sentences Move", "concept": "Action vs linking verbs", "hook": "movie scenes"},
            {"slug": "g6e-paragraphs", "title": "The Shape of a Paragraph", "concept": "Topic sentences", "hook": "burger model"},
            {"slug": "g6e-stories", "title": "Story Spine", "concept": "Beginning, middle, end", "hook": "pixar's rule of storytelling"},
            {"slug": "g6e-poems", "title": "Why Poems Rhyme", "concept": "Rhyme & rhythm", "hook": "songs you already know"},
        ],
        "coding": [
            {"slug": "g6c-thinking", "title": "Thinking Like a Computer", "concept": "Algorithms in everyday life", "hook": "morning routine recipe"},
            {"slug": "g6c-loops", "title": "Loops Are Lazy Genius", "concept": "Repeating tasks", "hook": "brushing teeth twice/day"},
            {"slug": "g6c-vars", "title": "Boxes With Labels", "concept": "Variables", "hook": "lunchbox holding sandwich"},
            {"slug": "g6c-ifelse", "title": "If This, Then That", "concept": "Conditionals", "hook": "umbrella decisions"},
        ],
    },
    7: {
        "math": [
            {"slug": "g7m-percent", "title": "Percentages Everywhere", "concept": "Percent as fraction of 100", "hook": "store sales"},
            {"slug": "g7m-proportion", "title": "Scaling the World", "concept": "Proportions & similar figures", "hook": "google maps zoom"},
            {"slug": "g7m-prob", "title": "Will It Happen?", "concept": "Basic probability", "hook": "dice & coin flips"},
            {"slug": "g7m-equations", "title": "Solving for X", "concept": "One-variable equations", "hook": "balance scale"},
            {"slug": "g7m-3d", "title": "Volumes That Hold Stuff", "concept": "Volume of prisms", "hook": "filling water bottles"},
        ],
        "science": [
            {"slug": "g7s-atoms", "title": "Everything Is Lego", "concept": "Atoms & molecules", "hook": "lego analogy"},
            {"slug": "g7s-energy", "title": "Energy Has Many Outfits", "concept": "Forms of energy", "hook": "skateboard ramp"},
            {"slug": "g7s-photosynthesis", "title": "Plants Cook With Sunlight", "concept": "Photosynthesis", "hook": "kitchen analogy"},
            {"slug": "g7s-circulation", "title": "Your Body's Highway System", "concept": "Circulatory system", "hook": "delivery trucks"},
            {"slug": "g7s-ecosystem-balance", "title": "When Ecosystems Tip Over", "concept": "Ecosystem balance", "hook": "wolf reintroduction yellowstone"},
        ],
        "english": [
            {"slug": "g7e-character", "title": "Characters Who Feel Real", "concept": "Character development", "hook": "your best friend's quirks"},
            {"slug": "g7e-figurative", "title": "When Words Wear Costumes", "concept": "Simile, metaphor, personification", "hook": "the sun smiled"},
            {"slug": "g7e-essay", "title": "Convincing Strangers", "concept": "Persuasive essays", "hook": "selling your sibling on pizza"},
            {"slug": "g7e-summary", "title": "Tiny Powerful Summaries", "concept": "Summarizing", "hook": "movie elevator pitch"},
        ],
        "coding": [
            {"slug": "g7c-lists", "title": "Lists Are Magic", "concept": "Lists & arrays", "hook": "grocery list"},
            {"slug": "g7c-functions", "title": "Tiny Reusable Machines", "concept": "Functions", "hook": "vending machine"},
            {"slug": "g7c-debug", "title": "Hunting Bugs Like Sherlock", "concept": "Debugging mindset", "hook": "broken remote control"},
            {"slug": "g7c-strings", "title": "Words Computers Read", "concept": "Strings", "hook": "text messages"},
        ],
    },
    8: {
        "math": [
            {"slug": "g8m-linear", "title": "Lines That Tell Stories", "concept": "Linear functions y=mx+b", "hook": "phone bills"},
            {"slug": "g8m-pythagoras", "title": "The Triangle Cheat Code", "concept": "Pythagorean theorem", "hook": "TV diagonals"},
            {"slug": "g8m-exponents", "title": "Numbers That Explode", "concept": "Exponents", "hook": "viral memes"},
            {"slug": "g8m-data", "title": "Lying With Statistics", "concept": "Scatter plots & correlation", "hook": "ice cream vs sunburns"},
        ],
        "science": [
            {"slug": "g8s-forces", "title": "Newton's 3 Magic Laws", "concept": "Newton's laws of motion", "hook": "rollerblading"},
            {"slug": "g8s-electricity", "title": "The Invisible River", "concept": "Electric current", "hook": "water pipe analogy"},
            {"slug": "g8s-genetics", "title": "Why You Have Mom's Eyes", "concept": "Heredity & DNA basics", "hook": "family photo album"},
            {"slug": "g8s-waves", "title": "Sound, Light, & Surfboards", "concept": "Wave properties", "hook": "ocean waves"},
            {"slug": "g8s-climate", "title": "The Earth Has a Fever", "concept": "Climate change", "hook": "greenhouse car"},
        ],
        "english": [
            {"slug": "g8e-themes", "title": "What's the Story Really About?", "concept": "Theme in literature", "hook": "harry potter is about love"},
            {"slug": "g8e-tone", "title": "Hearing the Author's Voice", "concept": "Tone & mood", "hook": "text messages you've misread"},
            {"slug": "g8e-research", "title": "Trusting What You Read", "concept": "Evaluating sources", "hook": "tiktok facts vs reality"},
        ],
        "coding": [
            {"slug": "g8c-objects", "title": "Building Blocks With Memory", "concept": "Objects & dictionaries", "hook": "ID cards"},
            {"slug": "g8c-loops-cond", "title": "Smart Loops", "concept": "Nested loops & conditions", "hook": "sorting laundry"},
            {"slug": "g8c-projects", "title": "Your First Real App", "concept": "Mini projects", "hook": "to-do list builder"},
        ],
    },
    9: {
        "math": [
            {"slug": "g9m-algebra", "title": "Algebra: The Universal Language", "concept": "Algebra fundamentals", "hook": "physics needs it"},
            {"slug": "g9m-quad", "title": "Curves That Toss Balls", "concept": "Quadratic functions", "hook": "basketball arc"},
            {"slug": "g9m-systems", "title": "Two Lines, One Truth", "concept": "Systems of equations", "hook": "where they meet"},
            {"slug": "g9m-geom", "title": "Proving the Obvious", "concept": "Geometric proofs", "hook": "court of law style"},
        ],
        "science": [
            {"slug": "g9s-bio-evolution", "title": "How a Whale Almost Was a Dog", "concept": "Evolution & natural selection", "hook": "darwin's finches"},
            {"slug": "g9s-chem-reactions", "title": "When Matter Transforms", "concept": "Chemical reactions", "hook": "baking cookies"},
            {"slug": "g9s-physics-motion", "title": "Why Things Move", "concept": "Kinematics", "hook": "elevator rides"},
            {"slug": "g9s-cells-deep", "title": "The Cell Is a Factory", "concept": "Organelles & functions", "hook": "factory tour"},
        ],
        "english": [
            {"slug": "g9e-shakespeare", "title": "Why Shakespeare Still Works", "concept": "Reading Shakespeare", "hook": "drama is forever"},
            {"slug": "g9e-rhetoric", "title": "Persuasion Is a Superpower", "concept": "Ethos, pathos, logos", "hook": "ads break down"},
            {"slug": "g9e-narrative", "title": "Writing Stories People Want", "concept": "Narrative writing", "hook": "your weirdest day"},
        ],
        "coding": [
            {"slug": "g9c-html", "title": "Your Words On the Web", "concept": "HTML basics", "hook": "building your bio page"},
            {"slug": "g9c-css", "title": "Making Things Beautiful", "concept": "CSS styling", "hook": "instagram-look pages"},
            {"slug": "g9c-js", "title": "Pages That Listen", "concept": "JavaScript basics", "hook": "click & it responds"},
        ],
    },
    10: {
        "math": [
            {"slug": "g10m-trig", "title": "Triangles Run the World", "concept": "Trigonometry basics", "hook": "GPS uses it"},
            {"slug": "g10m-functions", "title": "Functions Are Vending Machines", "concept": "Function families", "hook": "in→out"},
            {"slug": "g10m-prob-deep", "title": "How Casinos Always Win", "concept": "Probability & expected value", "hook": "lottery math"},
            {"slug": "g10m-coordinate", "title": "Drawing With Numbers", "concept": "Coordinate geometry", "hook": "minecraft is just coordinates"},
        ],
        "science": [
            {"slug": "g10s-bio-systems", "title": "Your Body Has 11 Apps", "concept": "Body systems", "hook": "iphone analogy"},
            {"slug": "g10s-chem-bonds", "title": "Atoms Holding Hands", "concept": "Chemical bonding", "hook": "friendship analogy"},
            {"slug": "g10s-physics-energy", "title": "The Energy Bank", "concept": "Energy conservation", "hook": "rollercoaster"},
            {"slug": "g10s-earth-plates", "title": "Continents That Drift", "concept": "Plate tectonics", "hook": "pizza dough"},
        ],
        "english": [
            {"slug": "g10e-analysis", "title": "Reading Between the Lines", "concept": "Literary analysis", "hook": "decoding song lyrics"},
            {"slug": "g10e-arguments", "title": "Win Any Argument (With Logic)", "concept": "Argumentative essays", "hook": "debating curfew"},
            {"slug": "g10e-syntax", "title": "Sentences That Sing", "concept": "Advanced syntax", "hook": "instagram captions"},
        ],
        "coding": [
            {"slug": "g10c-python-basics", "title": "Python Speaks Human", "concept": "Python fundamentals", "hook": "talk to your computer"},
            {"slug": "g10c-data-structures", "title": "Storing Stuff Smartly", "concept": "Stacks, queues, dicts", "hook": "cafeteria trays"},
            {"slug": "g10c-api", "title": "Programs That Talk", "concept": "APIs basics", "hook": "weather apps"},
        ],
    },
    11: {
        "math": [
            {"slug": "g11m-calc-intro", "title": "The Math of Change", "concept": "Limits & intro to calculus", "hook": "speedometer at a snapshot"},
            {"slug": "g11m-derivatives", "title": "Slopes That Move", "concept": "Derivatives", "hook": "car speed at each instant"},
            {"slug": "g11m-vectors", "title": "Arrows That Add", "concept": "Vectors", "hook": "boat against current"},
            {"slug": "g11m-stats-deep", "title": "Lying With Big Data", "concept": "Inferential statistics", "hook": "election polls"},
        ],
        "science": [
            {"slug": "g11s-bio-genetics", "title": "Editing Life Itself", "concept": "Molecular genetics & CRISPR", "hook": "find/replace in DNA"},
            {"slug": "g11s-chem-org", "title": "The Chemistry of Carbon", "concept": "Organic chemistry intro", "hook": "everything alive is carbon"},
            {"slug": "g11s-physics-waves", "title": "Why You See Anything", "concept": "Electromagnetic spectrum", "hook": "infrared sees heat"},
            {"slug": "g11s-bio-ecology", "title": "Saving the Planet, Quantified", "concept": "Ecology & sustainability", "hook": "your carbon footprint"},
        ],
        "english": [
            {"slug": "g11e-classics", "title": "Why Old Books Still Slap", "concept": "Reading the classics", "hook": "gatsby on tiktok"},
            {"slug": "g11e-thesis", "title": "Building a Thesis That Holds", "concept": "Thesis writing", "hook": "engineering analogy"},
            {"slug": "g11e-media", "title": "Reading Media Critically", "concept": "Media literacy", "hook": "deepfakes 101"},
        ],
        "coding": [
            {"slug": "g11c-oop", "title": "Code That Thinks in Objects", "concept": "Object-oriented programming", "hook": "blueprints vs houses"},
            {"slug": "g11c-databases", "title": "Where Apps Remember Things", "concept": "Databases & SQL", "hook": "library shelves"},
            {"slug": "g11c-react", "title": "Building Real Web Apps", "concept": "React intro", "hook": "lego components"},
        ],
    },
    12: {
        "math": [
            {"slug": "g12m-integrals", "title": "Math That Adds Up Infinity", "concept": "Integrals", "hook": "area under a curve"},
            {"slug": "g12m-diffeq", "title": "Equations That Predict the Future", "concept": "Differential equations", "hook": "covid spread model"},
            {"slug": "g12m-linear-algebra", "title": "The Math Behind AI", "concept": "Matrices & vectors", "hook": "instagram filters use it"},
        ],
        "science": [
            {"slug": "g12s-physics-quantum", "title": "Reality Is Weirder Than You Thought", "concept": "Intro to quantum", "hook": "schrödinger's cat"},
            {"slug": "g12s-chem-equilibrium", "title": "The Push and Pull of Reactions", "concept": "Chemical equilibrium", "hook": "tug of war"},
            {"slug": "g12s-bio-biotech", "title": "Designing Life", "concept": "Biotechnology", "hook": "lab-grown burgers"},
            {"slug": "g12s-physics-relativity", "title": "Time Bends", "concept": "Intro to relativity", "hook": "GPS would fail without it"},
        ],
        "english": [
            {"slug": "g12e-college-essay", "title": "Writing the Essay That Opens Doors", "concept": "College application essay", "hook": "what makes you unforgettable"},
            {"slug": "g12e-research-paper", "title": "Long-Form Thinking", "concept": "Research papers", "hook": "becoming an expert"},
            {"slug": "g12e-rhetoric-deep", "title": "Master Persuader Mode", "concept": "Advanced rhetoric", "hook": "ted talks decoded"},
        ],
        "coding": [
            {"slug": "g12c-ai-intro", "title": "Teaching Computers to Learn", "concept": "Intro to ML", "hook": "how netflix knows you"},
            {"slug": "g12c-fullstack", "title": "Build Your First Real Product", "concept": "Full-stack project", "hook": "ship a real app"},
            {"slug": "g12c-algorithms", "title": "Algorithms That Got You Into the Internet", "concept": "Classic algorithms", "hook": "google search basics"},
        ],
    },
}


def all_lessons():
    out = []
    for grade, subjects in CURRICULUM.items():
        for subj_key, lessons in subjects.items():
            for l in lessons:
                out.append({
                    "slug": l["slug"],
                    "grade": grade,
                    "subject": subj_key,
                    "subject_name": SUBJECTS[subj_key]["name"],
                    "subject_color": SUBJECTS[subj_key]["color"],
                    "title": l["title"],
                    "concept": l["concept"],
                    "hook": l["hook"],
                })
    return out


def find_lesson(slug: str):
    for lesson in all_lessons():
        if lesson["slug"] == slug:
            return lesson
    return None


def lessons_for(grade: int, subject: str):
    return [l for l in all_lessons() if l["grade"] == grade and l["subject"] == subject]


GRADES = list(CURRICULUM.keys())
