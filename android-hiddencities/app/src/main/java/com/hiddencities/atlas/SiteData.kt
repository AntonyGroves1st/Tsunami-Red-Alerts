package com.hiddencities.atlas

/**
 * Curated atlas of real hidden caves and concealed entrances that lead down into
 * underground / rock-cut cities and settlements around the world.
 *
 * Coordinates are approximate entrance locations intended for orientation only.
 */
object SiteData {

    val all: List<HiddenSite> = listOf(
        HiddenSite(
            id = "derinkuyu",
            name = "Derinkuyu Underground City",
            aka = "Elengubu",
            country = "Turkey",
            region = "Cappadocia, Nevşehir",
            type = SiteType.UNDERGROUND_CITY,
            lat = 38.3730, lng = 34.7350,
            era = "Byzantine expansion of Phrygian / Hittite-era tunnels",
            depthNote = "~18 carved levels, roughly 60 m deep, once sheltering ~20,000 people",
            access = Access.PUBLIC_TOUR,
            shortDesc = "The deepest excavated underground city, sealed by giant rolling stone doors.",
            entranceHint = "Rediscovered in 1963 when a resident knocked through a wall of his house and found a passage behind it. Ventilation shafts disguised as ordinary wells riddle the town above.",
            description = "Derinkuyu descends through some eighteen levels of stables, wine presses, chapels, kitchens and living quarters, all carved from soft volcanic tuff. Half-tonne circular stone doors could be rolled shut to seal each level from the inside, and more than fifty ventilation shafts kept the deepest halls breathable. It connects by a long tunnel to the neighbouring city of Kaymaklı."
        ),
        HiddenSite(
            id = "kaymakli",
            name = "Kaymaklı Underground City",
            aka = "Enegup",
            country = "Turkey",
            region = "Cappadocia, Nevşehir",
            type = SiteType.UNDERGROUND_CITY,
            lat = 38.4636, lng = 34.7500,
            era = "Hittite-era origins, expanded in the Byzantine period",
            depthNote = "8 levels (4 open), the widest of the Cappadocian underground cities",
            access = Access.PUBLIC_TOUR,
            shortDesc = "A honeycombed underground town built around a network of low, sloping tunnels.",
            entranceHint = "Entrances hide among the courtyard houses of the modern village of Kaymaklı — the surface homes are built directly on top of the first hidden level.",
            description = "Kaymaklı spreads outward rather than downward, its passages kept deliberately narrow, low and steep so that intruders had to advance stooped and single-file. Communal kitchens, stables, storage rooms and a church surround a central ventilation shaft. A five-kilometre tunnel is said to have once linked it to Derinkuyu."
        ),
        HiddenSite(
            id = "ozkonak",
            name = "Özkonak Underground City",
            aka = null,
            country = "Turkey",
            region = "Cappadocia, Nevşehir",
            type = SiteType.UNDERGROUND_CITY,
            lat = 38.7256, lng = 34.8722,
            era = "Roman / early Byzantine",
            depthNote = "10 levels reported, ~4 accessible",
            access = Access.PUBLIC_TOUR,
            shortDesc = "A defensive underground city with pipe-holes for pouring hot oil on invaders.",
            entranceHint = "Found in 1972 by a local farmer, Latif Acar, chasing where his crop water kept vanishing into the ground — it was draining into the hidden halls below.",
            description = "Özkonak adds a distinctive defensive trick to the Cappadocian formula: narrow holes drilled above the entrance corridors let defenders drop hot oil onto anyone who forced the rolling stone doors. Its galleries include a winery, water wells and living spaces cut into the tuff of Mount Idis."
        ),
        HiddenSite(
            id = "nushabad",
            name = "Nushabad Underground City",
            aka = "Ouyi",
            country = "Iran",
            region = "Kashan, Isfahan Province",
            type = SiteType.UNDERGROUND_CITY,
            lat = 34.1069, lng = 51.4408,
            era = "Sasanian era, ~1,500+ years old",
            depthNote = "Three levels reaching ~16 m below the desert town",
            access = Access.GUIDED_ONLY,
            shortDesc = "A hand-dug refuge city hidden entirely beneath a desert town.",
            entranceHint = "Access shafts open from inside old houses, courtyards and the qanat water channels — the whole city stayed secret until modern sewer digging broke into it.",
            description = "Ouyi was carved as a place of refuge from invaders, with air ducts, toilets, benches and cul-de-sac galleries engineered to confuse attackers. Precisely placed shafts brought fresh air deep underground, and trap corridors let a handful of defenders hold off many. Residents lived above ground and fled below only when raiders approached."
        ),
        HiddenSite(
            id = "kish_kariz",
            name = "Kariz-e Kish",
            aka = "Kish Underground City",
            country = "Iran",
            region = "Kish Island, Persian Gulf",
            type = SiteType.TUNNEL_NETWORK,
            lat = 26.5580, lng = 53.9800,
            era = "~2,500-year-old qanat, now a subterranean complex",
            depthNote = "~10,000 m² of galleries, 16 m below the island",
            access = Access.PUBLIC_TOUR,
            shortDesc = "An ancient water-tunnel system reborn as a walkable underground city.",
            entranceHint = "The way down is a modern stairwell inside a Kish shopping district, descending into the old qanat that once irrigated the island.",
            description = "Kariz-e Kish reuses a 2,500-year-old qanat — an underground aqueduct of hand-dug tunnels and access wells — that tapped a freshwater lens beneath a coral island. Its ceilings are studded with fossilised corals and shells. Restored galleries now hold shops, an amphitheatre and cafés far below the desert surface."
        ),
        HiddenSite(
            id = "naours",
            name = "Cité Souterraine de Naours",
            aka = "The Underground City of Naours",
            country = "France",
            region = "Somme, Hauts-de-France",
            type = SiteType.UNDERGROUND_CITY,
            lat = 50.0192, lng = 2.2733,
            era = "Enlarged from medieval times through the 17th century",
            depthNote = "~2 km of galleries, ~300 rooms, 33 m below a wood",
            access = Access.PUBLIC_TOUR,
            shortDesc = "A muck-hole quarry turned refuge city for whole villages during raids.",
            entranceHint = "The entrances were hidden in the forest and disguised as ordinary quarry 'muches' (hiding holes); chimneys were vented through a farmhouse to mask the smoke.",
            description = "Beneath a beech wood, Naours grew into a true underground town with squares, chapels, stables and bakeries able to shelter around 3,000 people during the wars and raids that swept Picardy. Forgotten for a century, it was reopened in 1887. During the First World War thousands of Allied soldiers left graffiti on its walls."
        ),
        HiddenSite(
            id = "paris_catacombs",
            name = "Catacombs of Paris",
            aka = "Les Catacombes",
            country = "France",
            region = "Paris",
            type = SiteType.TUNNEL_NETWORK,
            lat = 48.8338, lng = 2.3324,
            era = "Quarries from the 13th c.; ossuary from 1786",
            depthNote = "~300 km of tunnels citywide; ~20 m below street level",
            access = Access.PUBLIC_TOUR,
            shortDesc = "A vast quarry labyrinth beneath Paris lined with the bones of millions.",
            entranceHint = "The official entrance is a small dark doorway by Denfert-Rochereau, but 'cataphiles' slip into the wider off-limits network through manholes, rail tunnels and hidden hatches.",
            description = "The Catacombs occupy former limestone quarries whose stone built Paris above. From 1786 the remains of some six million people were transferred here from overflowing cemeteries and stacked into walls of skulls and femurs. Only a short, sanctioned loop is open; the surrounding hundreds of kilometres are forbidden and easy to become lost in."
        ),
        HiddenSite(
            id = "wieliczka",
            name = "Wieliczka Salt Mine",
            aka = null,
            country = "Poland",
            region = "Wieliczka, near Kraków",
            type = SiteType.MINE,
            lat = 49.9835, lng = 20.0546,
            era = "Mined continuously from the 13th century",
            depthNote = "9 levels, ~327 m deep, ~287 km of galleries",
            access = Access.PUBLIC_TOUR,
            shortDesc = "A subterranean city of salt with chapels, lakes and carved cathedrals.",
            entranceHint = "Visitors descend a wooden staircase of nearly 400 steps down a mine shaft to reach the first level of the hidden salt world.",
            description = "Over seven centuries miners hollowed Wieliczka into an underground realm complete with brine lakes, chandeliered ballrooms and the breathtaking Chapel of St. Kinga — an entire church, altarpieces and all, carved from rock salt. Timbered chambers descend more than 300 metres beneath the surface town."
        ),
        HiddenSite(
            id = "cu_chi",
            name = "Củ Chi Tunnels",
            aka = null,
            country = "Vietnam",
            region = "Củ Chi, Ho Chi Minh City",
            type = SiteType.TUNNEL_NETWORK,
            lat = 11.1436, lng = 106.4600,
            era = "Dug in the 1940s, vastly expanded in the 1960s",
            depthNote = "~250 km network on up to three levels, some down to ~10 m",
            access = Access.PUBLIC_TOUR,
            shortDesc = "A hand-dug guerrilla underworld with kitchens, hospitals and hidden hatches.",
            entranceHint = "Entrances were tiny trapdoors camouflaged with leaves and earth — barely shoulder-width — often set beside decoy termite mounds used as vents.",
            description = "The Củ Chi tunnels formed a self-contained underground world of living quarters, field hospitals, armouries, kitchens and command posts. Kitchen smoke was vented far away through winding channels, and the passages were deliberately narrow with false floors, dead ends and booby traps. Whole communities lived below ground here for years."
        ),
        HiddenSite(
            id = "coober_pedy",
            name = "Coober Pedy Dugouts",
            aka = "kupa-piti (\"white man in a hole\")",
            country = "Australia",
            region = "South Australia outback",
            type = SiteType.CAVE_DWELLING,
            lat = -29.0139, lng = 134.7544,
            era = "Opal-mining town, dug in from around 1915",
            depthNote = "Homes, churches and hotels cut into the hillsides underground",
            access = Access.PUBLIC_TOUR,
            shortDesc = "An opal town that moved underground to escape furnace-hot desert heat.",
            entranceHint = "Ordinary-looking doors and stovepipe vents in the hillsides are the only sign of the homes, shops and churches tunnelled into the rock behind them.",
            description = "In the searing heat of the South Australian desert, the opal-mining community of Coober Pedy dug its life underground, where the temperature stays mild year-round. 'Dugouts' include family homes, bars, bookshops and beautiful subterranean churches. Many residents literally strike opal while extending a bedroom."
        ),
        HiddenSite(
            id = "matmata",
            name = "Matmata Troglodyte Dwellings",
            aka = null,
            country = "Tunisia",
            region = "Gabès Governorate",
            type = SiteType.CAVE_DWELLING,
            lat = 33.5443, lng = 9.9715,
            era = "Berber pit-dwellings, centuries old",
            depthNote = "Pit courtyards ~7 m deep with rooms tunnelled from the walls",
            access = Access.PUBLIC_TOUR,
            shortDesc = "Berber homes sunk as craters into the earth, rooms bored from the pit walls.",
            entranceHint = "From the surface you see only round craters; a sloping tunnel leads down into each open courtyard, off which the living rooms are dug sideways.",
            description = "The Berbers of Matmata dug large circular pits into the soft ground, then carved rooms horizontally into the walls of each pit, creating cool, sheltered homes hidden from the harsh climate and from raiders. Linked by tunnels, some courtyards connect underground. One dwelling famously served as the Lars homestead in Star Wars."
        ),
        HiddenSite(
            id = "bulla_regia",
            name = "Bulla Regia",
            aka = null,
            country = "Tunisia",
            region = "Jendouba Governorate",
            type = SiteType.CAVE_DWELLING,
            lat = 36.5580, lng = 8.7580,
            era = "Roman, 2nd–3rd century AD",
            depthNote = "Villas with entire mosaic-floored storeys built below ground",
            access = Access.PUBLIC_TOUR,
            shortDesc = "Roman villas that hid their finest rooms in a cool underground storey.",
            entranceHint = "Stairways descend from ordinary ground-floor atria into the buried lower villas — the hidden level is where the summer living really happened.",
            description = "To beat the North African heat, the wealthy of Roman Bulla Regia built subterranean storeys beneath their houses, complete with columned courtyards and superb mosaic floors that survive vividly intact because they were sealed underground. Descending a staircase from a plain ruin at surface reveals whole rooms preserved below."
        ),
        HiddenSite(
            id = "setenil",
            name = "Setenil de las Bodegas",
            aka = null,
            country = "Spain",
            region = "Cádiz, Andalusia",
            type = SiteType.CAVE_DWELLING,
            lat = 36.8639, lng = -5.1806,
            era = "Cave dwellings inhabited since prehistory; town from ~12th c.",
            depthNote = "Houses tucked under a massive overhanging rock shelf along a gorge",
            access = Access.PUBLIC_TOUR,
            shortDesc = "A whole town built into the underside of a cliff along a river gorge.",
            entranceHint = "The 'entrances' are house fronts that vanish under the living rock — the street's ceiling is a single vast boulder, with homes bored back into the cliff.",
            description = "Setenil grew inside the gorge of the Río Trejo, where townsfolk enclosed natural rock overhangs to make homes, bars and bodegas whose roofs are simply the cliff itself. Streets like Calle Cuevas del Sol run beneath enormous ledges of stone, blurring the line between cave and house."
        ),
        HiddenSite(
            id = "matera",
            name = "Sassi di Matera",
            aka = "I Sassi",
            country = "Italy",
            region = "Basilicata",
            type = SiteType.CAVE_DWELLING,
            lat = 40.6664, lng = 16.6115,
            era = "Among the oldest continuously inhabited settlements, ~9,000 years",
            depthNote = "Two districts of cave homes and cisterns terraced into a ravine",
            access = Access.PUBLIC_TOUR,
            shortDesc = "Ancient cave dwellings stacked into a ravine, one home's roof the next one's street.",
            entranceHint = "Behind many carved façades the rooms bore deep into the tufa; hidden beneath the town lies the Palombaro Lungo, a cathedral-sized rock cistern reached by a stairway.",
            description = "The Sassi are two districts of dwellings, churches and workshops carved directly into the soft tufa of a ravine, layered so densely that streets often run across neighbours' rooftops. Beneath them lies a labyrinth of cisterns, including the vast Palombaro Lungo. Emptied as slums in the 1950s, the Sassi are now a UNESCO World Heritage Site."
        ),
        HiddenSite(
            id = "orvieto",
            name = "Orvieto Underground",
            aka = "Orvieto Sotterranea",
            country = "Italy",
            region = "Umbria",
            type = SiteType.TUNNEL_NETWORK,
            lat = 42.7185, lng = 12.1109,
            era = "Etruscan origins, extended over ~2,500 years",
            depthNote = "~1,200 caves, wells, tunnels and quarries inside a tufa plateau",
            access = Access.GUIDED_ONLY,
            shortDesc = "A hidden city of caves and wells honeycombed inside the cliff Orvieto sits on.",
            entranceHint = "Cellar doors and unremarkable openings in the cliff-top town drop into Etruscan wells, olive mills and dovecotes bored right through the rock.",
            description = "The town of Orvieto perches on a plateau of volcanic tufa that its inhabitants have burrowed into for 2,500 years, creating some 1,200 cavities: wells, quarries, olive presses, dovecotes and refuge tunnels. Each noble family dug its own cellars, and in sieges the population could live and work entirely within the rock."
        ),
        HiddenSite(
            id = "vardzia",
            name = "Vardzia Cave City",
            aka = null,
            country = "Georgia",
            region = "Samtskhe-Javakheti",
            type = SiteType.ROCK_CITY,
            lat = 41.3811, lng = 43.2847,
            era = "Carved in the 12th century under Queen Tamar",
            depthNote = "Up to 19 tiers, ~6,000 chambers running ~500 m along a cliff",
            access = Access.PUBLIC_TOUR,
            shortDesc = "A cliff-face monastery city with a concealed entrance through a spring tunnel.",
            entranceHint = "Vardzia was designed to be invisible from the valley: its only way in was a hidden tunnel by the Mtkvari River, so the whole city stayed screened behind the rock.",
            description = "Cut into the face of Erusheti Mountain, Vardzia once held up to 6,000 rooms across nineteen levels — a monastery, halls, wine cellars, a bakery and the church of the Dormition with its frescoes. A concealed riverside tunnel was the sole entrance. An earthquake in 1283 sheared away the outer rock, exposing the once-secret warren."
        ),
        HiddenSite(
            id = "longyou",
            name = "Longyou Caves",
            aka = "Xiaonanhai Stone Chambers",
            country = "China",
            region = "Zhejiang Province",
            type = SiteType.CAVE_SYSTEM,
            lat = 29.0280, lng = 119.1720,
            era = "Mysterious; possibly over 2,000 years old",
            depthNote = "At least 24 enormous hand-carved grottoes up to ~30 m deep",
            access = Access.PUBLIC_TOUR,
            shortDesc = "Colossal chiselled caverns of unknown purpose, hidden under a village pond.",
            entranceHint = "The chambers lay unknown beneath ponds until 1992, when villagers pumped a 'bottomless' pond dry and found a vast carved hall hidden below the water.",
            description = "The Longyou Caves are a group of at least twenty-four immense chambers carved by hand from siltstone, their walls covered in uniform chisel marks and their pillars precisely placed. No historical record explains who made them, when, or why. They were discovered only in 1992 when local villagers drained the ponds concealing their entrances."
        ),
        HiddenSite(
            id = "dixia_cheng",
            name = "Beijing Underground City",
            aka = "Dìxià Chéng",
            country = "China",
            region = "Beijing",
            type = SiteType.TUNNEL_NETWORK,
            lat = 39.8890, lng = 116.4110,
            era = "Built 1969–1979 as a Cold War bomb shelter",
            depthNote = "~85 km of tunnels ~8–18 m below central Beijing",
            access = Access.RESTRICTED,
            shortDesc = "A Cold War bomb-shelter city dug beneath Beijing, entered through shop trapdoors.",
            entranceHint = "There were around a thousand disguised entrances hidden inside ordinary shops and homes near Qianmen — trapdoors and hatches leading straight down into the network.",
            description = "Fearing nuclear or Soviet attack, Beijing hand-dug an enormous shelter network beneath the city, intended to move much of the population underground. It was planned to include shops, clinics, schools, a roller rink and even a mushroom farm for food. Long open as a curiosity, most access points are now officially closed."
        ),
        HiddenSite(
            id = "zhongdong",
            name = "Zhongdong Cave Village",
            aka = "Miao cave settlement",
            country = "China",
            region = "Ziyun County, Guizhou",
            type = SiteType.CAVE_DWELLING,
            lat = 25.9500, lng = 105.6300,
            era = "Settled from the mid-20th century",
            depthNote = "An entire village built inside one giant natural cavern",
            access = Access.GUIDED_ONLY,
            shortDesc = "A whole village of houses built inside the mouth of a single vast cave.",
            entranceHint = "There is no door to knock on — the 'entrance' is the huge natural cave mouth itself, high on a mountainside, sheltering the whole hamlet inside.",
            description = "Deep in the mountains of Guizhou, the Miao community of Zhongdong built roofless brick-and-bamboo houses inside a single cathedral-like cavern, which shields them from rain and storms. The cave even held a school for years. Reachable only on foot up the mountain, it is sometimes called the last cave village in China."
        ),
        HiddenSite(
            id = "burlington",
            name = "Burlington Bunker",
            aka = "Site 3 / Central Government War HQ",
            country = "United Kingdom",
            region = "Corsham, Wiltshire",
            type = SiteType.BUNKER,
            lat = 51.4300, lng = -2.1900,
            era = "Built in the 1950s inside a Victorian stone quarry",
            depthNote = "~1 km² of tunnels ~30 m underground for ~4,000 people",
            access = Access.RESTRICTED,
            shortDesc = "A secret underground city built to run Britain through a nuclear war.",
            entranceHint = "Hidden in disused Bath-stone quarries and reached through unremarkable surface buildings, the whole site was classified and denied for decades.",
            description = "Codenamed Burlington, this Cold War complex was a secret subterranean city meant to house the Prime Minister, cabinet and thousands of staff to govern Britain after a nuclear strike. It held a telephone exchange, a BBC studio, hospital, laundry, kitchens and an underground lake for water. Its very existence was secret until declassified in 2004."
        ),
        HiddenSite(
            id = "edinburgh_vaults",
            name = "Edinburgh's South Bridge Vaults",
            aka = "The Underground Vaults",
            country = "United Kingdom",
            region = "Edinburgh, Scotland",
            type = SiteType.TUNNEL_NETWORK,
            lat = 55.9490, lng = -3.1880,
            era = "Formed within South Bridge, completed 1788",
            depthNote = "~120 chambers hidden inside the arches of a bridge",
            access = Access.GUIDED_ONLY,
            shortDesc = "A warren of vaults sealed inside a bridge, later a hidden slum underworld.",
            entranceHint = "The chambers are buried inside the stone arches of South Bridge — from the street you would never guess a lost quarter lies within and beneath the roadway.",
            description = "When South Bridge was built, its nineteen arches enclosed a maze of vaults used first as workshops and storage, then, as damp set in, as squalid dwellings and taverns for the city's poorest. Sealed and forgotten for over a century, they were rediscovered in the 1980s and are now toured for their history — and their ghost stories."
        ),
        HiddenSite(
            id = "moose_jaw",
            name = "Tunnels of Moose Jaw",
            aka = null,
            country = "Canada",
            region = "Moose Jaw, Saskatchewan",
            type = SiteType.TUNNEL_NETWORK,
            lat = 50.3930, lng = -105.5510,
            era = "Early 20th century",
            depthNote = "A network of passages beneath the downtown streets",
            access = Access.PUBLIC_TOUR,
            shortDesc = "Prohibition-era tunnels beneath a prairie town, steeped in bootlegging lore.",
            entranceHint = "The passages were reached through hidden hatches and basements of downtown buildings, linking businesses out of sight below the street.",
            description = "Beneath downtown Moose Jaw runs a network of tunnels tied to stories of Chinese railway workers who lived and hid below ground, and to Prohibition-era bootlegging said to reach as far as Al Capone's operations. Whatever the truth of the legends, the passages are real and now house costumed underground tours."
        ),
        HiddenSite(
            id = "guanajuato",
            name = "Tunnels of Guanajuato",
            aka = "Túneles de Guanajuato",
            country = "Mexico",
            region = "Guanajuato",
            type = SiteType.TUNNEL_NETWORK,
            lat = 21.0190, lng = -101.2570,
            era = "Flood-control tunnels adapted for traffic from the 20th c.",
            depthNote = "Kilometres of stone road-tunnels threaded beneath the city",
            access = Access.PUBLIC_TOUR,
            shortDesc = "A city whose roads run through a subterranean maze of old river tunnels.",
            entranceHint = "Ordinary street ramps dive from daylight straight into stone-lined tunnels — much of the city's traffic quietly flows through the rock below the plazas.",
            description = "Guanajuato sits in a steep ravine that once flooded catastrophically, so engineers channelled the river underground through masonry tunnels. As the flood threat eased, the dry tunnels were repurposed as an underground road network, giving the colonial city a hidden lower level of streets, junctions and doorways carved into rock."
        ),
        HiddenSite(
            id = "mesa_verde",
            name = "Mesa Verde Cliff Dwellings",
            aka = "Cliff Palace",
            country = "United States",
            region = "Colorado",
            type = SiteType.CAVE_DWELLING,
            lat = 37.1830, lng = -108.4870,
            era = "Ancestral Puebloan, ~1190–1300 AD",
            depthNote = "~150-room villages tucked into natural cliff alcoves",
            access = Access.GUIDED_ONLY,
            shortDesc = "Stone villages hidden inside sheer canyon alcoves, reached by ladders and toeholds.",
            entranceHint = "The dwellings sit in recessed cliff alcoves invisible from the mesa top; the Ancestral Puebloans climbed in and out by hand-and-toe holds pecked into the rock.",
            description = "In the alcoves of Mesa Verde's canyon walls, the Ancestral Puebloans built multi-storey stone villages such as Cliff Palace, with round ceremonial kivas sunk into the floor and rooms stacked against the overhang. Sheltered and easily defended, the dwellings were reached only by precarious climbs, then mysteriously abandoned around 1300 AD."
        ),
        HiddenSite(
            id = "shanghai_tunnels",
            name = "Portland Shanghai Tunnels",
            aka = "Old Portland Underground",
            country = "United States",
            region = "Portland, Oregon",
            type = SiteType.TUNNEL_NETWORK,
            lat = 45.5230, lng = -122.6730,
            era = "Late 19th to early 20th century",
            depthNote = "Basements and passages linking Old Town to the waterfront",
            access = Access.GUIDED_ONLY,
            shortDesc = "Waterfront basement passages wrapped in dark tales of 'shanghaiing'.",
            entranceHint = "Trapdoors in saloon and hotel floors, and connecting basement doorways, gave hidden access between buildings and toward the river — legend says for kidnapping sailors.",
            description = "Beneath Portland's Old Town, a network of connected basements and passages once linked hotels and bars to the waterfront. Local legend holds they were used to 'shanghai' drugged men through trapdoors and sell them to ship crews. Historians debate the kidnapping tales, but the tunnels, trapdoors and holding cells are real and can be toured."
        ),
        HiddenSite(
            id = "znojmo",
            name = "Znojmo Underground",
            aka = "Znojemské podzemí",
            country = "Czech Republic",
            region = "Znojmo, South Moravia",
            type = SiteType.TUNNEL_NETWORK,
            lat = 48.8555, lng = 16.0488,
            era = "Dug from the 14th–15th centuries onward",
            depthNote = "~27 km of multi-level cellars and passages under the old town",
            access = Access.GUIDED_ONLY,
            shortDesc = "A multi-level medieval passage city hidden beneath a Moravian old town.",
            entranceHint = "The system began as ordinary house cellars that residents secretly dug and connected, until the ground beneath the town became a hidden labyrinth on several levels.",
            description = "Townsfolk of Znojmo expanded their wine cellars downward and outward over centuries until they merged into one of Central Europe's largest underground networks: some twenty-seven kilometres of interconnected passages on up to four levels. Fitted with ventilation, wells, smoke traps and escape routes, it served as refuge and storage in times of war."
        )
    )

    fun byId(id: String): HiddenSite? = all.firstOrNull { it.id == id }

    /**
     * Filter + free-text search over the atlas.
     *
     * @param query case-insensitive text matched against the search index
     * @param type restrict to a single [SiteType], or null for all
     * @param favoriteIds when [favoritesOnly] is true, only sites in this set are returned
     */
    fun filter(
        query: String = "",
        type: SiteType? = null,
        favoritesOnly: Boolean = false,
        favoriteIds: Set<String> = emptySet()
    ): List<HiddenSite> {
        val q = query.trim().lowercase()
        return all.filter { site ->
            (type == null || site.type == type) &&
                (!favoritesOnly || favoriteIds.contains(site.id)) &&
                (q.isEmpty() || q.split(" ").all { token -> site.searchIndex.contains(token) })
        }.sortedBy { it.name }
    }
}
