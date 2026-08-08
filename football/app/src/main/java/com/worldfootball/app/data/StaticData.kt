package com.worldfootball.app.data

import com.worldfootball.app.data.model.BigStat
import com.worldfootball.app.data.model.Player
import com.worldfootball.app.data.model.StatLine
import com.worldfootball.app.data.model.Venue
import com.worldfootball.app.data.model.Wag

/**
 * Curated, offline datasets for the sections that have no free public API:
 * all-time legends, breakout young talents, a light-hearted WAGs board,
 * marquee venues (for the weather board) and headline "big stats".
 *
 * These are editorial/best-effort figures for a fan app, not an official record.
 */
object StaticData {

    val leagues: List<Pair<String, String>> = listOf(
        "4328" to "Premier League",
        "4335" to "La Liga",
        "4332" to "Serie A",
        "4331" to "Bundesliga",
        "4334" to "Ligue 1",
        "4480" to "Champions League",
        "4481" to "Europa League",
        "4337" to "Eredivisie",
        "4344" to "Primeira Liga",
        "4346" to "MLS"
    )

    val venues: List<Venue> = listOf(
        Venue("Old Trafford", "Manchester", 53.4631, -2.2913),
        Venue("Anfield", "Liverpool", 53.4308, -2.9608),
        Venue("Emirates Stadium", "London", 51.5549, -0.1084),
        Venue("Etihad Stadium", "Manchester", 53.4831, -2.2004),
        Venue("Tottenham Hotspur Stadium", "London", 51.6043, -0.0665),
        Venue("Santiago Bernabéu", "Madrid", 40.4531, -3.6883),
        Venue("Spotify Camp Nou", "Barcelona", 41.3809, 2.1228),
        Venue("Metropolitano", "Madrid", 40.4362, -3.5995),
        Venue("Allianz Arena", "Munich", 48.2188, 11.6247),
        Venue("Signal Iduna Park", "Dortmund", 51.4926, 7.4519),
        Venue("San Siro", "Milan", 45.4781, 9.1240),
        Venue("Allianz Stadium", "Turin", 45.1096, 7.6413),
        Venue("Parc des Princes", "Paris", 48.8414, 2.2530),
        Venue("Estádio da Luz", "Lisbon", 38.7526, -9.1847)
    )

    val legends: List<Player> = listOf(
        Player(
            "Pelé", "Brazil", "Forward", "Santos / Cosmos", 99,
            "Three-time World Cup winner and football's first global icon.",
            listOf(StatLine("World Cups", "3"), StatLine("Career goals", "1000+"), StatLine("Débuted", "1956")),
            0xFFFFC400, era = "1956–1977",
            bio = "Edson Arantes do Nascimento redefined what was possible, scoring over 1,000 goals and winning three World Cups — a feat no other man has managed. Equal parts power, balance and improvisation, he made Brazil the spiritual home of beautiful football.",
            honours = listOf("World Cup 1958, 1962, 1970", "Intercontinental Cup ×2", "Copa Libertadores ×2", "FIFA Player of the Century"),
            traits = listOf("Finishing", "Balance", "Vision", "Big-game genius")
        ),
        Player(
            "Diego Maradona", "Argentina", "Attacking Mid", "Napoli / Boca", 98,
            "Dragged Napoli and Argentina to glory with impossible genius.",
            listOf(StatLine("World Cup", "1986"), StatLine("Serie A", "2"), StatLine("Magic", "∞")),
            0xFF56CCF2, era = "1976–1997",
            bio = "The ultimate one-man team. Maradona almost single-handedly won the 1986 World Cup and turned unfashionable Napoli into champions of Italy, all with a low centre of gravity and a left foot from another dimension.",
            honours = listOf("World Cup 1986", "Serie A ×2 (Napoli)", "UEFA Cup 1989", "Golden Ball 1986"),
            traits = listOf("Dribbling", "Left foot", "Set pieces", "Leadership")
        ),
        Player(
            "Lionel Messi", "Argentina", "Forward", "Barcelona / Inter Miami", 99,
            "Eight Ballons d'Or and a World Cup to complete the set.",
            listOf(StatLine("Ballon d'Or", "8"), StatLine("Goals", "850+"), StatLine("World Cup", "2022")),
            0xFF9B51E0, era = "2004–present",
            bio = "The most decorated player in history. Messi combines record-breaking output with impossible close control, and finally lifted the World Cup in 2022 to silence every debate.",
            honours = listOf("World Cup 2022", "Ballon d'Or ×8", "Champions League ×4", "La Liga ×10", "Copa América 2021"),
            traits = listOf("Dribbling", "Passing", "Finishing", "Free-kicks")
        ),
        Player(
            "Cristiano Ronaldo", "Portugal", "Forward", "Real / Man Utd / Al-Nassr", 98,
            "The all-time top scorer and relentless serial winner.",
            listOf(StatLine("Ballon d'Or", "5"), StatLine("Goals", "900+"), StatLine("UCLs", "5")),
            0xFF2F80ED, era = "2002–present",
            bio = "A machine of ambition and athleticism. Ronaldo is the record scorer in men's football and the Champions League, reinventing himself from flying winger to lethal penalty-box predator.",
            honours = listOf("Champions League ×5", "Ballon d'Or ×5", "Euro 2016", "League titles in ENG, ESP, ITA"),
            traits = listOf("Heading", "Power", "Finishing", "Mentality")
        ),
        Player(
            "Johan Cruyff", "Netherlands", "Forward", "Ajax / Barcelona", 97,
            "Invented Total Football as a player and as a coach.",
            listOf(StatLine("Ballon d'Or", "3"), StatLine("Euro Cups", "3"), StatLine("Turn", "1974")),
            0xFFEB5757, era = "1964–1984",
            bio = "The intellectual of the game. Cruyff was the on-pitch conductor of Total Football and later built the philosophy that still defines Barcelona and much of modern coaching.",
            honours = listOf("European Cup ×3 (Ajax)", "Ballon d'Or ×3", "8× Eredivisie", "La Liga (Barcelona)"),
            traits = listOf("Vision", "Movement", "Technique", "Football IQ")
        ),
        Player(
            "Alfredo Di Stéfano", "Argentina/Spain", "Forward", "Real Madrid", 96,
            "The engine of the greatest club side of the 1950s.",
            listOf(StatLine("European Cups", "5"), StatLine("Ballon d'Or", "2"), StatLine("Goals", "300+")),
            0xFF27AE60, era = "1945–1966",
            bio = "The complete footballer before the term existed — Di Stéfano defended, created and scored, powering Real Madrid to five straight European Cups.",
            honours = listOf("European Cup ×5", "Ballon d'Or ×2", "La Liga ×8"),
            traits = listOf("Stamina", "Finishing", "Playmaking", "Versatility")
        ),
        Player(
            "Ferenc Puskás", "Hungary", "Forward", "Real Madrid / Honvéd", 96,
            "A left foot that fired the Magical Magyars and Real Madrid.",
            listOf(StatLine("Int'l goals", "84"), StatLine("European Cups", "3"), StatLine("Caps", "89")),
            0xFFF2C94C, era = "1943–1966",
            bio = "One of the deadliest strikers ever, Puskás scored at almost a goal a game for Hungary and starred in Real Madrid's European dynasty. FIFA's goal-of-the-year award bears his name.",
            honours = listOf("European Cup ×3", "Olympic gold 1952", "La Liga ×5"),
            traits = listOf("Left foot", "Finishing", "Vision")
        ),
        Player(
            "Ronaldo Nazário", "Brazil", "Striker", "Inter / Real / Barça", 97,
            "O Fenômeno — the most explosive striker the game has seen.",
            listOf(StatLine("World Cups", "2"), StatLine("Ballon d'Or", "2"), StatLine("Goals", "400+")),
            0xFFFF7A00, era = "1993–2011",
            bio = "Before two devastating knee injuries, R9 was unstoppable — pace, power and cold finishing rolled into one. He still returned to top-score at the 2002 World Cup.",
            honours = listOf("World Cup 1994, 2002", "Ballon d'Or ×2", "UEFA Cup", "La Liga"),
            traits = listOf("Pace", "Dribbling", "Finishing"),
            wiki = "Ronaldo (Brazilian footballer)"
        ),
        Player(
            "Zinédine Zidane", "France", "Attacking Mid", "Juventus / Real Madrid", 96,
            "World Cup winner and the most elegant midfielder of his era.",
            listOf(StatLine("World Cup", "1998"), StatLine("Ballon d'Or", "1"), StatLine("UCL", "1")),
            0xFF00C2A8, era = "1989–2006",
            bio = "Grace under pressure. Zidane glided through midfields and delivered on the biggest stages, from the 1998 World Cup final to that volley in the 2002 Champions League final.",
            honours = listOf("World Cup 1998", "Euro 2000", "Champions League 2002", "Ballon d'Or 1998"),
            traits = listOf("Close control", "Vision", "Big games")
        ),
        Player(
            "Franz Beckenbauer", "Germany", "Sweeper", "Bayern Munich", 96,
            "Der Kaiser — won the World Cup as captain and manager.",
            listOf(StatLine("World Cup", "1974"), StatLine("Ballon d'Or", "2"), StatLine("Euro Cups", "3")),
            0xFFBB6BD9, era = "1964–1983",
            bio = "The inventor of the modern attacking sweeper. Beckenbauer brought elegance to defending and lifted the World Cup as both captain (1974) and manager (1990).",
            honours = listOf("World Cup 1974", "European Cup ×3", "Ballon d'Or ×2", "Euro 1972"),
            traits = listOf("Reading", "Passing", "Leadership")
        ),
        Player(
            "George Best", "N. Ireland", "Winger", "Manchester United", 95,
            "Football's first pop-star talent and a dribbling wizard.",
            listOf(StatLine("Ballon d'Or", "1"), StatLine("European Cup", "1"), StatLine("Goals", "179")),
            0xFFEB5757, era = "1963–1983",
            bio = "Genius and glamour. Best mesmerised defenders with either foot and helped Manchester United become the first English winners of the European Cup.",
            honours = listOf("European Cup 1968", "Ballon d'Or 1968", "First Division ×2"),
            traits = listOf("Dribbling", "Balance", "Flair")
        ),
        Player(
            "Eusébio", "Portugal", "Forward", "Benfica", 95,
            "The Black Panther — pace and power that lit up the 1966 World Cup.",
            listOf(StatLine("Ballon d'Or", "1"), StatLine("WC66 goals", "9"), StatLine("Goals", "700+")),
            0xFFFFC400, era = "1960–1978",
            bio = "Eusébio combined a cannon of a shot with blistering pace, dragging Portugal to the 1966 semi-finals as the tournament's top scorer.",
            honours = listOf("European Cup 1962", "Ballon d'Or 1965", "11× Primeira Liga"),
            traits = listOf("Pace", "Shooting", "Finishing")
        ),
        Player(
            "Ronaldinho", "Brazil", "Attacking Mid", "Barcelona / Milan", 96,
            "Joy personified — the samba magician who made football fun.",
            listOf(StatLine("World Cup", "2002"), StatLine("Ballon d'Or", "1"), StatLine("UCL", "1")),
            0xFF9B51E0, era = "1998–2015",
            bio = "The most joyful footballer of his generation. Ronaldinho's tricks, no-look passes and toothy grin rebuilt Barcelona and won over even rival fans at the Bernabéu.",
            honours = listOf("World Cup 2002", "Champions League 2006", "Ballon d'Or 2005", "La Liga ×2"),
            traits = listOf("Flair", "Free-kicks", "Creativity")
        ),
        Player(
            "Xavi Hernández", "Spain", "Midfielder", "Barcelona", 95,
            "The metronome of tiki-taka's golden age.",
            listOf(StatLine("World Cup", "2010"), StatLine("Euros", "2"), StatLine("UCL", "4")),
            0xFF2F80ED, era = "1998–2019",
            bio = "The heartbeat of the greatest club and international sides of the era, Xavi dictated tempo with immaculate positioning and never-ending short passing.",
            honours = listOf("World Cup 2010", "Euro 2008, 2012", "Champions League ×4", "La Liga ×8"),
            traits = listOf("Passing", "Positioning", "Tempo"),
            wiki = "Xavi"
        ),
        Player(
            "Andrés Iniesta", "Spain", "Midfielder", "Barcelona", 95,
            "The man for the biggest moments — including a World Cup winner.",
            listOf(StatLine("World Cup", "2010"), StatLine("Euros", "2"), StatLine("UCL", "4")),
            0xFF27AE60, era = "2002–present",
            bio = "Impossible to dispossess and ice-cold in the clutch, Iniesta scored the goal that won Spain the 2010 World Cup and glided through a decade of finals.",
            honours = listOf("World Cup 2010", "Euro 2008, 2012", "Champions League ×4", "La Liga ×9"),
            traits = listOf("Close control", "Composure", "Big games")
        ),
        Player(
            "Gerd Müller", "Germany", "Striker", "Bayern Munich", 95,
            "Der Bomber — the ultimate penalty-box poacher.",
            listOf(StatLine("Int'l goals", "68"), StatLine("Bundesliga goals", "365"), StatLine("World Cup", "1974")),
            0xFFF2C94C, era = "1964–1981",
            bio = "A goalscoring phenomenon whose Bundesliga record stood for 49 years. Müller lived in the six-yard box and scored the winner in the 1974 World Cup final.",
            honours = listOf("World Cup 1974", "European Cup ×3", "Euro 1972", "Ballon d'Or 1970"),
            traits = listOf("Poaching", "Finishing", "Positioning")
        )
    )

    val youngGuns: List<Player> = listOf(
        Player(
            "Lamine Yamal", "Spain", "Winger", "Barcelona", 89,
            "A teenage Euro winner already bending games to his will.",
            listOf(StatLine("Age", "18"), StatLine("Ceiling", "Generational"), StatLine("Foot", "Left")),
            0xFFEB5757, era = "Breakout 2023",
            bio = "The youngest player and scorer at a European Championship, Yamal is a left-footed winger with the composure of a veteran and the ceiling of an all-time great.",
            honours = listOf("Euro 2024 winner", "La Liga (Barcelona)", "Golden Boy 2024"),
            traits = listOf("Dribbling", "Left foot", "Composure", "Vision")
        ),
        Player(
            "Endrick", "Brazil", "Striker", "Real Madrid", 86,
            "Explosive Brazilian No.9 built for the Bernabéu spotlight.",
            listOf(StatLine("Age", "19"), StatLine("Trait", "Finishing"), StatLine("Pace", "9/10")),
            0xFFF2C94C, era = "Breakout 2023",
            bio = "A powerful, direct striker who arrived at Real Madrid with sky-high expectations after tearing up Brazilian football as a teenager.",
            honours = listOf("Move to Real Madrid", "Brazil senior caps"),
            traits = listOf("Pace", "Finishing", "Strength")
        ),
        Player(
            "Arda Güler", "Turkey", "Playmaker", "Real Madrid", 85,
            "Silky left foot tipped to run midfields for a decade.",
            listOf(StatLine("Age", "20"), StatLine("Trait", "Vision"), StatLine("Set pieces", "Elite")),
            0xFF56CCF2, era = "Breakout 2023",
            bio = "A classical number ten with a wand of a left foot, Güler blends set-piece mastery with a growing tactical maturity at the Bernabéu.",
            honours = listOf("Move to Real Madrid", "Euro 2024 stunner vs Georgia"),
            traits = listOf("Passing", "Set pieces", "Vision")
        ),
        Player(
            "Warren Zaïre-Emery", "France", "Midfielder", "Paris SG", 85,
            "Complete box-to-box engine captaining at a ridiculous age.",
            listOf(StatLine("Age", "19"), StatLine("Trait", "Engine"), StatLine("Caps", "Senior")),
            0xFF2F80ED, era = "Breakout 2022",
            bio = "PSG's youngest-ever debutant and scorer, WZE is a mature, two-way midfielder already trusted with senior France minutes.",
            honours = listOf("Ligue 1 titles", "France senior caps"),
            traits = listOf("Engine", "Passing", "Maturity")
        ),
        Player(
            "Kobbie Mainoo", "England", "Midfielder", "Manchester United", 84,
            "Composed, press-resistant metronome from the Carrington line.",
            listOf(StatLine("Age", "20"), StatLine("Trait", "Composure"), StatLine("Turns", "Silky")),
            0xFF27AE60, era = "Breakout 2023",
            bio = "A calm, press-resistant midfielder who broke into United and England in a single season, capped by an FA Cup final winner.",
            honours = listOf("FA Cup 2024", "Euro 2024 finalist"),
            traits = listOf("Composure", "Dribbling", "Passing")
        ),
        Player(
            "Pau Cubarsí", "Spain", "Centre-Back", "Barcelona", 84,
            "Ball-playing defender with the calm of a ten-year veteran.",
            listOf(StatLine("Age", "18"), StatLine("Trait", "Reading"), StatLine("Passing", "9/10")),
            0xFF9B51E0, era = "Breakout 2024",
            bio = "A serene, ball-playing centre-back who reads danger early and starts attacks with crisp progressive passing.",
            honours = listOf("La Liga (Barcelona)", "Spain youth"),
            traits = listOf("Reading", "Passing", "Positioning")
        ),
        Player(
            "Désiré Doué", "France", "Forward", "Paris SG", 85,
            "Two-footed dribbler who delivered on the biggest nights.",
            listOf(StatLine("Age", "20"), StatLine("Trait", "Dribbling"), StatLine("Big games", "Yes")),
            0xFFBB6BD9, era = "Breakout 2023",
            bio = "A fearless, two-footed forward who thrives in tight spaces and stepped up in Champions League knockout football.",
            honours = listOf("Ligue 1", "Champions League nights"),
            traits = listOf("Dribbling", "Two-footed", "Big games")
        ),
        Player(
            "Estêvão", "Brazil", "Winger", "Chelsea", 85,
            "\"Messinho\" — a direct, fearless winger with end product.",
            listOf(StatLine("Age", "18"), StatLine("Trait", "1v1"), StatLine("Hype", "Sky-high")),
            0xFFFFC400, era = "Breakout 2023",
            bio = "Nicknamed 'Little Messi', Estêvão is a direct right-winger who cuts inside onto his left and already produces goals and assists at senior level.",
            honours = listOf("Move to Chelsea", "Brazil call-ups"),
            traits = listOf("1v1", "Left foot", "End product"),
            wiki = "Estêvão Willian"
        ),
        Player(
            "Leny Yoro", "France", "Centre-Back", "Manchester United", 84,
            "Rangy, quick centre-back with elite recovery pace.",
            listOf(StatLine("Age", "19"), StatLine("Trait", "Recovery"), StatLine("Aerial", "Strong")),
            0xFF00C2A8, era = "Breakout 2023",
            bio = "A tall, quick defender comfortable in a high line, Yoro pairs recovery pace with confident distribution.",
            honours = listOf("Move to Man Utd", "France youth"),
            traits = listOf("Pace", "Aerial", "Composure")
        ),
        Player(
            "Kenan Yıldız", "Turkey", "Forward", "Juventus", 84,
            "Elegant forward wearing Juve's iconic No.10.",
            listOf(StatLine("Age", "20"), StatLine("Trait", "Technique"), StatLine("Foot", "Left")),
            0xFF2F80ED, era = "Breakout 2023",
            bio = "A graceful left-footer entrusted with the Juventus No.10, Yıldız links play and finishes with equal ease.",
            honours = listOf("Serie A minutes", "Turkey senior"),
            traits = listOf("Technique", "Left foot", "Link play")
        ),
        Player(
            "Franco Mastantuono", "Argentina", "Playmaker", "Real Madrid", 84,
            "River Plate prodigy with a fearless final ball.",
            listOf(StatLine("Age", "18"), StatLine("Trait", "Creativity"), StatLine("Set pieces", "Elite")),
            0xFFEB5757, era = "Breakout 2024",
            bio = "A precocious Argentine playmaker with dead-ball quality and a big-game temperament, snapped up young by Real Madrid.",
            honours = listOf("Move to Real Madrid", "Argentina youth"),
            traits = listOf("Creativity", "Set pieces", "Vision")
        ),
        Player(
            "João Neves", "Portugal", "Midfielder", "Paris SG", 85,
            "Tenacious, all-action midfield technician.",
            listOf(StatLine("Age", "20"), StatLine("Trait", "Press"), StatLine("Passing", "Tidy")),
            0xFF27AE60, era = "Breakout 2023",
            bio = "A tireless, technically clean midfielder who wins the ball high and keeps possession ticking, tipped for a decade at the top.",
            honours = listOf("Ligue 1", "Portugal senior"),
            traits = listOf("Pressing", "Passing", "Energy"),
            wiki = "João Neves (footballer, born 2004)"
        )
    )

    val wags: List<Wag> = listOf(
        Wag("Antonela Roccuzzo", "Lionel Messi", "Businesswoman & dentistry graduate; runs brand & family ventures.", 95, 92, 0xFF9B51E0,
            nationality = "Argentina", profession = "Businesswoman",
            highlights = listOf("Studied dentistry", "Fashion & brand ventures", "Childhood sweetheart of Messi")),
        Wag("Georgina Rodríguez", "Cristiano Ronaldo", "Model, entrepreneur and producer of her own hit series.", 96, 88, 0xFF2F80ED,
            nationality = "Spain", profession = "Model / Producer",
            highlights = listOf("Netflix series 'I Am Georgina'", "Fashion & jewellery collabs", "Philanthropy")),
        Wag("Sasha Attwood", "Jude Bellingham", "Model and content creator building an independent brand.", 93, 87, 0xFFEB5757,
            nationality = "England", profession = "Model / Creator",
            highlights = listOf("Modelling campaigns", "Large social following", "Mental-health advocacy")),
        Wag("Mikky Kiemeney", "Frenkie de Jong", "Field-hockey talent turned fashion designer & label owner.", 92, 90, 0xFF27AE60,
            nationality = "Netherlands", profession = "Designer / Athlete",
            highlights = listOf("Played competitive field hockey", "Founded a fashion label", "Design studies")),
        Wag("Pilar Rubio", "Sergio Ramos", "TV presenter, reporter and author with a long media career.", 91, 91, 0xFFF2C94C,
            nationality = "Spain", profession = "TV Presenter / Author",
            highlights = listOf("Prime-time TV presenter", "Published author", "Fitness brand")),
        Wag("Perrie Edwards", "Alex Oxlade-Chamberlain", "Global pop star (Little Mix) and businesswoman.", 92, 89, 0xFF56CCF2,
            nationality = "England", profession = "Musician / Entrepreneur",
            highlights = listOf("Little Mix — multi-platinum", "Founded Disora brand", "Solo music")),
        Wag("Izabel Goulart", "Kevin Trapp", "Supermodel and fitness entrepreneur.", 95, 84, 0xFFBB6BD9,
            nationality = "Brazil", profession = "Supermodel",
            highlights = listOf("Victoria's Secret Angel", "Global runway career", "Fitness brand")),
        Wag("Fern Hawkins", "Harry Maguire", "Physiotherapy graduate (First-Class honours).", 88, 94, 0xFFFFC400,
            nationality = "England", profession = "Physiotherapist",
            highlights = listOf("First-Class physiotherapy degree", "Science background", "Family-focused")),
        Wag("Daniella Semaan", "Cesc Fàbregas", "Entrepreneur and lifestyle brand founder.", 90, 88, 0xFF2F80ED,
            nationality = "Lebanon", profession = "Entrepreneur",
            highlights = listOf("Lifestyle brand founder", "Fashion collaborations")),
        Wag("Maja Nilsson", "Martin Ødegaard", "Influencer and travel/lifestyle creator.", 91, 86, 0xFF00C2A8,
            nationality = "Norway", profession = "Creator",
            highlights = listOf("Lifestyle content", "Travel features")),
        Wag("Taylor Ward", "Riyad Mahrez", "Model and reality-TV personality.", 92, 84, 0xFFEB5757,
            nationality = "England", profession = "Model",
            highlights = listOf("Modelling career", "TV appearances")),
        Wag("Kika Cerqueira Gomes", "João Félix", "Model and fashion-industry personality.", 91, 85, 0xFF9B51E0,
            nationality = "Portugal", profession = "Model",
            highlights = listOf("Fashion campaigns", "Brand collaborations"))
    )

    val bigStats: List<BigStat> = listOf(
        BigStat("All-time top scorer", "900+", "Cristiano Ronaldo, career goals for club & country", 1.0f, 0xFF2F80ED,
            facts = listOf("Record men's international scorer", "Top scorer in Champions League history", "League titles in England, Spain & Italy")),
        BigStat("Ballons d'Or", "8", "Lionel Messi — more than any player in history", 1.0f, 0xFF9B51E0,
            facts = listOf("First win 2009, latest 2023", "Also a World Cup winner 2022", "Record for a single player")),
        BigStat("UCL titles (club)", "15", "Real Madrid, the record holders of Europe", 0.94f, 0xFFFFC400,
            facts = listOf("Won the first five European Cups", "More than double the next club", "The 'kings of Europe'")),
        BigStat("World Cups (nation)", "5", "Brazil — the only five-star nation", 0.83f, 0xFF27AE60,
            facts = listOf("1958, 1962, 1970, 1994, 2002", "Only side to play every World Cup", "Home of Pelé, Ronaldo, Ronaldinho")),
        BigStat("Fastest recorded shot", "131 kph", "Ronny Heberson's thunderbolt free-kick", 0.87f, 0xFFEB5757,
            facts = listOf("Sporting CP, 2006", "Reported at ~131 km/h", "One of the hardest ever struck")),
        BigStat("Longest unbeaten run (top-5)", "43", "Arsenal 'Invincibles' era league games", 0.72f, 0xFF56CCF2,
            facts = listOf("Unbeaten 2003–04 season", "38 games without defeat in one campaign", "Managed by Arsène Wenger")),
        BigStat("Most league goals in a year", "91", "Lionel Messi's 2012 calendar-year record", 0.9f, 0xFFBB6BD9,
            facts = listOf("Set in the 2012 calendar year", "Beat Gerd Müller's 1972 mark", "For Barcelona & Argentina")),
        BigStat("Highest transfer fee", "€222m", "Neymar, PSG from Barcelona (2017)", 0.78f, 0xFF00C2A8,
            facts = listOf("More than doubled the previous record", "Triggered his release clause", "Still the world record")),
        BigStat("Most Ballon d'Or nations", "—", "France, Portugal, Argentina & more represented", 0.6f, 0xFFF2C94C,
            facts = listOf("A truly global award", "Winners across four confederations")),
        BigStat("Most appearances (caps)", "200+", "Record international caps club", 0.8f, 0xFF2F80ED,
            facts = listOf("Bader Al-Mutawa & Soh Chin Ann era", "Longevity at the very top"))
    )
}
