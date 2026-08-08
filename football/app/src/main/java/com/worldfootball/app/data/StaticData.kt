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
        "4480" to "Champions League"
    )

    val venues: List<Venue> = listOf(
        Venue("Old Trafford", "Manchester", 53.4631, -2.2913),
        Venue("Anfield", "Liverpool", 53.4308, -2.9608),
        Venue("Emirates Stadium", "London", 51.5549, -0.1084),
        Venue("Santiago Bernabéu", "Madrid", 40.4531, -3.6883),
        Venue("Camp Nou", "Barcelona", 41.3809, 2.1228),
        Venue("Allianz Arena", "Munich", 48.2188, 11.6247),
        Venue("San Siro", "Milan", 45.4781, 9.1240),
        Venue("Parc des Princes", "Paris", 48.8414, 2.2530)
    )

    val legends: List<Player> = listOf(
        Player(
            "Pelé", "Brazil", "Forward", "Santos / Cosmos", 99,
            "Three-time World Cup winner and football's first global icon.",
            listOf(StatLine("World Cups", "3"), StatLine("Career goals", "1000+"), StatLine("Débuted", "1956")),
            0xFFFFC400
        ),
        Player(
            "Diego Maradona", "Argentina", "Attacking Mid", "Napoli / Boca", 98,
            "Dragged Napoli and Argentina to glory with impossible genius.",
            listOf(StatLine("World Cup", "1986"), StatLine("Serie A", "2"), StatLine("Magic", "∞")),
            0xFF56CCF2
        ),
        Player(
            "Lionel Messi", "Argentina", "Forward", "Barcelona / Inter Miami", 99,
            "Eight Ballons d'Or and a World Cup to complete the set.",
            listOf(StatLine("Ballon d'Or", "8"), StatLine("Goals", "850+"), StatLine("World Cup", "2022")),
            0xFF9B51E0
        ),
        Player(
            "Cristiano Ronaldo", "Portugal", "Forward", "Real / Man Utd / Al-Nassr", 98,
            "The all-time top scorer and relentless serial winner.",
            listOf(StatLine("Ballon d'Or", "5"), StatLine("Goals", "900+"), StatLine("UCLs", "5")),
            0xFF2F80ED
        ),
        Player(
            "Johan Cruyff", "Netherlands", "Forward", "Ajax / Barcelona", 97,
            "Invented Total Football as a player and as a coach.",
            listOf(StatLine("Ballon d'Or", "3"), StatLine("Euro Cups", "3"), StatLine("Turn", "1974")),
            0xFFEB5757
        ),
        Player(
            "Zinédine Zidane", "France", "Attacking Mid", "Juventus / Real Madrid", 96,
            "World Cup winner and the most elegant midfielder of his era.",
            listOf(StatLine("World Cup", "1998"), StatLine("Ballon d'Or", "1"), StatLine("UCL", "1")),
            0xFF27AE60
        ),
        Player(
            "Ronaldo Nazário", "Brazil", "Striker", "Inter / Real / Barça", 97,
            "O Fenômeno — the most explosive striker the game has seen.",
            listOf(StatLine("World Cups", "2"), StatLine("Ballon d'Or", "2"), StatLine("Goals", "400+")),
            0xFFF2C94C
        ),
        Player(
            "Franz Beckenbauer", "Germany", "Sweeper", "Bayern Munich", 96,
            "Der Kaiser — won the World Cup as captain and manager.",
            listOf(StatLine("World Cup", "1974"), StatLine("Ballon d'Or", "2"), StatLine("Euro Cups", "3")),
            0xFFBB6BD9
        )
    )

    val youngGuns: List<Player> = listOf(
        Player(
            "Lamine Yamal", "Spain", "Winger", "Barcelona", 89,
            "A teenage Euro winner already bending games to his will.",
            listOf(StatLine("Age", "18"), StatLine("Ceiling", "Generational"), StatLine("Foot", "Left")),
            0xFFEB5757
        ),
        Player(
            "Endrick", "Brazil", "Striker", "Real Madrid", 86,
            "Explosive Brazilian No.9 built for the Bernabéu spotlight.",
            listOf(StatLine("Age", "19"), StatLine("Trait", "Finishing"), StatLine("Pace", "9/10")),
            0xFFF2C94C
        ),
        Player(
            "Arda Güler", "Turkey", "Playmaker", "Real Madrid", 85,
            "Silky left foot tipped to run midfields for a decade.",
            listOf(StatLine("Age", "20"), StatLine("Trait", "Vision"), StatLine("Set pieces", "Elite")),
            0xFF56CCF2
        ),
        Player(
            "Warren Zaïre-Emery", "France", "Midfielder", "Paris SG", 85,
            "Complete box-to-box engine captaining at a ridiculous age.",
            listOf(StatLine("Age", "19"), StatLine("Trait", "Engine"), StatLine("Caps", "Senior")),
            0xFF2F80ED
        ),
        Player(
            "Kobbie Mainoo", "England", "Midfielder", "Manchester United", 84,
            "Composed, press-resistant metronome from the Carrington line.",
            listOf(StatLine("Age", "20"), StatLine("Trait", "Composure"), StatLine("Turns", "Silky")),
            0xFF27AE60
        ),
        Player(
            "Pau Cubarsí", "Spain", "Centre-Back", "Barcelona", 84,
            "Ball-playing defender with the calm of a ten-year veteran.",
            listOf(StatLine("Age", "18"), StatLine("Trait", "Reading"), StatLine("Passing", "9/10")),
            0xFF9B51E0
        ),
        Player(
            "Désiré Doué", "France", "Forward", "Paris SG", 85,
            "Two-footed dribbler who delivered on the biggest nights.",
            listOf(StatLine("Age", "20"), StatLine("Trait", "Dribbling"), StatLine("Big games", "Yes")),
            0xFFBB6BD9
        ),
        Player(
            "Estêvão", "Brazil", "Winger", "Chelsea", 85,
            "\"Messinho\" — a direct, fearless winger with end product.",
            listOf(StatLine("Age", "18"), StatLine("Trait", "1v1"), StatLine("Hype", "Sky-high")),
            0xFFFFC400
        )
    )

    val wags: List<Wag> = listOf(
        Wag("Antonela Roccuzzo", "Lionel Messi", "Businesswoman & dentistry graduate; runs brand & family ventures.", 95, 92, 0xFF9B51E0),
        Wag("Georgina Rodríguez", "Cristiano Ronaldo", "Model, entrepreneur and producer of her own hit series.", 96, 88, 0xFF2F80ED),
        Wag("Sasha Attwood", "Jude Bellingham", "Model and content creator building an independent brand.", 93, 87, 0xFFEB5757),
        Wag("Mikky Kiemeney", "Frenkie de Jong", "Field-hockey talent turned fashion designer & label owner.", 92, 90, 0xFF27AE60),
        Wag("Pilar Rubio", "Sergio Ramos", "TV presenter, reporter and author with a long media career.", 91, 91, 0xFFF2C94C),
        Wag("Perrie Edwards", "Alex Oxlade-Chamberlain", "Global pop star (Little Mix) and businesswoman.", 92, 89, 0xFF56CCF2),
        Wag("Izabel Goulart", "Kevin Trapp", "Supermodel and fitness entrepreneur.", 95, 84, 0xFFBB6BD9),
        Wag("Fern Hawkins", "Harry Maguire", "Physiotherapy graduate (First-Class honours).", 88, 94, 0xFFFFC400)
    )

    val bigStats: List<BigStat> = listOf(
        BigStat("All-time top scorer", "900+", "Cristiano Ronaldo, career goals for club & country", 1.0f, 0xFF2F80ED),
        BigStat("Ballons d'Or", "8", "Lionel Messi — more than any player in history", 1.0f, 0xFF9B51E0),
        BigStat("UCL titles (club)", "15", "Real Madrid, the record holders of Europe", 0.94f, 0xFFFFC400),
        BigStat("World Cups (nation)", "5", "Brazil — the only five-star nation", 0.83f, 0xFF27AE60),
        BigStat("Fastest recorded shot", "131 kph", "Ronny Heberson's thunderbolt free-kick", 0.87f, 0xFFEB5757),
        BigStat("Longest unbeaten run (top-5)", "43", "Arsenal 'Invincibles' era league games", 0.72f, 0xFF56CCF2)
    )
}
