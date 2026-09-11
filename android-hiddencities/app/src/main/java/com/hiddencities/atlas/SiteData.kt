package com.hiddencities.atlas

/**
 * A global atlas of real hidden caves, concealed entrances and the underground /
 * rock-cut cities they lead into — plus a clearly labelled set of legendary
 * underworlds and mythic gateways (Agartha, Hades, Xibalba, Sheol and more).
 *
 * Coordinates are approximate entrance / orientation points only. Legendary
 * entries use a representative location and are marked [SiteType.MYTH_GATEWAY]
 * with [Access.LEGENDARY]; treat them as folklore, not fact.
 */
object SiteData {

    // Lazy so the per-continent lists (declared below) are initialised first.
    val all: List<HiddenSite> by lazy {
        asia + europe + africa + northAmerica + southAmerica + oceania + legends
    }

    // ---------------------------------------------------------------- ASIA ---

    private val asia = listOf(
        HiddenSite(
            "derinkuyu", "Derinkuyu Underground City", "Elengubu",
            "Turkey", "Cappadocia, Nevşehir", "Asia", SiteType.UNDERGROUND_CITY,
            38.3730, 34.7350,
            "Phrygian / Hittite-era origins, expanded by Byzantines",
            "~18 levels, roughly 60 m deep, once sheltering up to 20,000 people",
            Access.PUBLIC_TOUR,
            "The deepest excavated underground city, sealed by giant rolling stone doors.",
            "Rediscovered in 1963 when a resident knocked through a wall of his house and found a passage behind it; ventilation wells riddle the town above.",
            "Derinkuyu descends through some eighteen levels of stables, wine presses, chapels and living quarters carved from soft volcanic tuff. Half-tonne circular stone doors sealed each level from inside, and over fifty shafts kept the deepest halls breathable. A long tunnel is said to have linked it to Kaymaklı."
        ),
        HiddenSite(
            "kaymakli", "Kaymaklı Underground City", "Enegup",
            "Turkey", "Cappadocia, Nevşehir", "Asia", SiteType.UNDERGROUND_CITY,
            38.4636, 34.7500,
            "Hittite-era origins, expanded in the Byzantine period",
            "8 levels (4 open), the widest of the Cappadocian underground cities",
            Access.PUBLIC_TOUR,
            "A honeycombed underground town of low, sloping defensive tunnels.",
            "Entrances hide among the courtyard houses of the modern village, whose homes sit directly on the first hidden level.",
            "Kaymaklı spreads outward rather than down, its passages kept narrow, low and steep so intruders had to advance stooped and single-file. Communal kitchens, stables, stores and a church surround a central ventilation shaft."
        ),
        HiddenSite(
            "ozkonak", "Özkonak Underground City", null,
            "Turkey", "Cappadocia, Nevşehir", "Asia", SiteType.UNDERGROUND_CITY,
            38.7256, 34.8722,
            "Roman / early Byzantine",
            "10 levels reported, roughly 4 accessible",
            Access.PUBLIC_TOUR,
            "A defensive underground city with holes for pouring hot oil on invaders.",
            "Found in 1972 by a farmer chasing where his crop water kept vanishing into the ground — into the hidden halls below.",
            "Özkonak adds a defensive trick to the Cappadocian formula: narrow holes above the entrance corridors let defenders pour hot oil on anyone forcing the rolling stone doors. Its galleries include a winery, wells and living spaces in the tuff of Mount Idis."
        ),
        HiddenSite(
            "mazi", "Mazı Underground City", null,
            "Turkey", "Cappadocia, Nevşehir", "Asia", SiteType.UNDERGROUND_CITY,
            38.3086, 34.8811,
            "Roman / Byzantine",
            "Several levels with unusually large stables",
            Access.PUBLIC_TOUR,
            "A quieter Cappadocian city notable for its huge underground stables.",
            "Four separate entrances open among the rock houses of Mazı village, each once closable with a millstone door.",
            "Mazı is one of the lesser-visited Cappadocian underground cities, distinguished by broad rock-cut stables, a church, wineries and cellars. Its multiple concealed entrances and rolling stone doors let villagers vanish underground when raiders came."
        ),
        HiddenSite(
            "saratli", "Saratlı Kırkgöz Underground City", null,
            "Turkey", "Aksaray", "Asia", SiteType.UNDERGROUND_CITY,
            38.3667, 34.4667,
            "Byzantine",
            "Three restored levels with rolling stone doors",
            Access.PUBLIC_TOUR,
            "A restored underground city with kitchens, church and stone-door defences.",
            "The way in is a modest opening on the Aksaray plain, leading down into halls that stayed hidden beneath farmland.",
            "Saratlı's Kırkgöz (\"forty rooms\") complex was rediscovered in the 20th century and partly restored. Living rooms, a chapel, kitchens, ventilation shafts and defensive stone doors are cut into three levels of tuff."
        ),
        HiddenSite(
            "hierapolis_ploutonion", "Ploutonion at Hierapolis", "Pluto's Gate",
            "Turkey", "Pamukkale, Denizli", "Asia", SiteType.MYTH_GATEWAY,
            37.9271, 29.1289,
            "Greco-Roman sanctuary",
            "A small cave mouth venting lethal carbon-dioxide gas",
            Access.PUBLIC_TOUR,
            "An ancient shrine built over a cave that priests called a doorway to the underworld.",
            "The gateway is a grated cave mouth beside a temple; birds and animals brought to it died from the invisible gas pooling at ground level.",
            "The Ploutonion was dedicated to Pluto and Kore, gods of the underworld. Ancient writers marvelled that castrated priests could enter unharmed while sacrificial animals dropped dead — an effect modern science attributes to a lethal blanket of volcanic CO2 seeping from the fault below."
        ),
        HiddenSite(
            "nushabad", "Nushabad Underground City", "Ouyi",
            "Iran", "Kashan, Isfahan Province", "Asia", SiteType.UNDERGROUND_CITY,
            34.1069, 51.4408,
            "Sasanian era, over 1,500 years old",
            "Three levels reaching about 16 m below a desert town",
            Access.GUIDED_ONLY,
            "A hand-dug refuge city hidden entirely beneath a desert town.",
            "Access shafts open from inside old houses and qanat channels; the city stayed secret until modern sewer digging broke into it.",
            "Ouyi was carved as a refuge from invaders, with air ducts, benches, toilets and trap corridors engineered to confuse attackers. Residents lived above ground and fled below only when raiders approached."
        ),
        HiddenSite(
            "kish_kariz", "Kariz-e Kish", "Kish Underground City",
            "Iran", "Kish Island, Persian Gulf", "Asia", SiteType.TUNNEL_NETWORK,
            26.5580, 53.9800,
            "A qanat about 2,500 years old, now a walkable complex",
            "About 10,000 m² of galleries, 16 m below the island",
            Access.PUBLIC_TOUR,
            "An ancient water-tunnel system reborn as a subterranean city.",
            "The way down is a modern stairwell inside a Kish shopping district, descending into the old qanat that once watered the island.",
            "Kariz-e Kish reuses a 2,500-year-old qanat — hand-dug tunnels and wells that tapped a freshwater lens beneath a coral island. Its ceilings are studded with fossil corals and shells, and restored galleries now hold shops, an amphitheatre and cafés."
        ),
        HiddenSite(
            "kandovan", "Kandovan", null,
            "Iran", "East Azerbaijan", "Asia", SiteType.CAVE_DWELLING,
            37.7936, 46.2447,
            "Inhabited for around 700 years",
            "Cone-shaped rock homes several storeys tall",
            Access.PUBLIC_TOUR,
            "A living village of homes carved into volcanic ash cones.",
            "Doorways and windows are cut straight into the pale rock cones; the entrances are the only clue that families still live inside them.",
            "Kandovan's residents hollowed homes, stables and stores into the tapering tuff cones left by ancient eruptions of Mount Sahand. Unlike Cappadocia's abandoned cones, these are still lived in, warmed in winter and cool in summer by the thick rock."
        ),
        HiddenSite(
            "meymand", "Meymand", null,
            "Iran", "Kerman Province", "Asia", SiteType.CAVE_DWELLING,
            30.1500, 55.3167,
            "Continuously inhabited for millennia",
            "Around 400 hand-dug rock houses on a mountainside",
            Access.PUBLIC_TOUR,
            "One of Iran's oldest villages, its homes carved deep into the rock.",
            "The homes are entered through simple stone doorways; the living rooms bore several metres back into the mountain.",
            "Meymand is a semi-nomadic settlement where families move seasonally between mud houses and hand-carved rock dwellings known as kicheh. A UNESCO World Heritage Site, its cool, dark chambers have sheltered people for thousands of years."
        ),
        HiddenSite(
            "samen", "Samen Underground City", null,
            "Iran", "Malayer, Hamadan", "Asia", SiteType.UNDERGROUND_CITY,
            34.2967, 48.8214,
            "Pre-Islamic, later reused as a catacomb",
            "Multiple interconnected hand-carved levels",
            Access.RESTRICTED,
            "A hand-dug refuge and burial city hidden under a modern town.",
            "The galleries were found during construction work; entrances lie beneath present-day Samen and its cemetery.",
            "Samen began as an underground refuge with rooms, corridors and air shafts, and was later adapted as an extensive catacomb. Its interlocking levels show the same defensive logic as Iran's other hidden cities."
        ),
        HiddenSite(
            "vardzia", "Vardzia Cave City", null,
            "Georgia", "Samtskhe-Javakheti", "Asia", SiteType.ROCK_CITY,
            41.3811, 43.2847,
            "Carved in the 12th century under Queen Tamar",
            "Up to 19 tiers, once around 6,000 chambers over ~500 m",
            Access.PUBLIC_TOUR,
            "A cliff monastery city whose only way in was a concealed spring tunnel.",
            "Vardzia was invisible from the valley: its sole entrance was a hidden tunnel by the Mtkvari River.",
            "Cut into Erusheti Mountain, Vardzia held a monastery, halls, wine cellars, a bakery and the frescoed church of the Dormition. An earthquake in 1283 sheared away the outer rock, exposing the once-secret warren behind it."
        ),
        HiddenSite(
            "uplistsikhe", "Uplistsikhe", "The Lord's Fortress",
            "Georgia", "Shida Kartli", "Asia", SiteType.ROCK_CITY,
            41.9686, 44.2078,
            "Carved from the Early Iron Age, ~3,000 years old",
            "Rock-cut halls, streets and a secret tunnel to the river",
            Access.PUBLIC_TOUR,
            "One of the oldest rock-cut towns in the Caucasus, with a hidden escape tunnel.",
            "A concealed tunnel cut down to the Mtkvari River let defenders fetch water and escape unseen during sieges.",
            "Uplistsikhe is an ancient cave town of halls, wine cellars, a theatre and pagan temples carved into a rocky massif. Once a major pagan cult centre on the Silk Road, it kept a secret rock-cut tunnel to the river below."
        ),
        HiddenSite(
            "longyou", "Longyou Caves", "Xiaonanhai Stone Chambers",
            "China", "Zhejiang Province", "Asia", SiteType.CAVE_SYSTEM,
            29.0280, 119.1720,
            "Unknown; possibly over 2,000 years old",
            "At least 24 huge hand-carved grottoes up to ~30 m deep",
            Access.PUBLIC_TOUR,
            "Colossal chiselled caverns of unknown purpose, hidden beneath ponds.",
            "The chambers lay unknown until 1992, when villagers pumped a \"bottomless\" pond dry and found a vast carved hall below the water.",
            "The Longyou Caves are at least twenty-four immense chambers carved from siltstone, their walls covered in uniform chisel marks and their pillars precisely placed. No record explains who made them, when, or why."
        ),
        HiddenSite(
            "dixia_cheng", "Beijing Underground City", "Dìxià Chéng",
            "China", "Beijing", "Asia", SiteType.TUNNEL_NETWORK,
            39.8890, 116.4110,
            "Built 1969–1979 as a Cold War bomb shelter",
            "About 85 km of tunnels 8–18 m below central Beijing",
            Access.RESTRICTED,
            "A Cold War shelter city dug beneath Beijing, entered through shop trapdoors.",
            "Around a thousand disguised entrances hid inside ordinary shops and homes near Qianmen, leading straight down into the network.",
            "Fearing attack, Beijing hand-dug a vast shelter meant to move much of the population underground, planned with shops, clinics, schools, a rink and a mushroom farm. Long open as a curiosity, most access points are now closed."
        ),
        HiddenSite(
            "zhongdong", "Zhongdong Cave Village", "Miao cave settlement",
            "China", "Ziyun County, Guizhou", "Asia", SiteType.CAVE_DWELLING,
            25.9500, 105.6300,
            "Settled from the mid-20th century",
            "An entire village built inside one giant natural cavern",
            Access.GUIDED_ONLY,
            "A whole village of houses built inside the mouth of a single vast cave.",
            "There is no door to knock on — the entrance is the huge natural cave mouth high on a mountainside, sheltering the hamlet inside.",
            "In the mountains of Guizhou, the Miao community of Zhongdong built roofless brick-and-bamboo houses inside a cathedral-like cavern that shields them from storms. The cave even held a school for years."
        ),
        HiddenSite(
            "yaodong", "Yaodong Loess Dwellings", "cave homes of the Loess Plateau",
            "China", "Shaanxi Province", "Asia", SiteType.CAVE_DWELLING,
            36.5850, 109.4900,
            "A tradition thousands of years old",
            "Millions of arched dwellings dug into loess hillsides",
            Access.PUBLIC_TOUR,
            "Arched earth homes carved into cliffs, still housing tens of millions.",
            "Rows of arched doorways cut into a loess bank are the entrances; the rooms tunnel back into the soft yellow earth.",
            "Yaodong are cave dwellings hollowed from the thick loess of northern China, naturally warm in winter and cool in summer. Whole communities live in them; Mao Zedong famously commanded from yaodong at Yan'an."
        ),
        HiddenSite(
            "guyaju", "Guyaju Cave Dwellings", null,
            "China", "Yanqing, Beijing", "Asia", SiteType.CAVE_DWELLING,
            40.4667, 115.7333,
            "Roughly 1,000 years old, makers uncertain",
            "Around 350 rooms carved into cliff faces",
            Access.PUBLIC_TOUR,
            "The largest ancient cliff-cave dwellings near Beijing, of mysterious origin.",
            "Stone-cut steps and doorways climb the cliff face into rooms with carved beds, stoves and niches.",
            "Guyaju (\"ancient cliff dwellings\") is a honeycomb of over a hundred cave homes on multiple levels, complete with hearths and stone furniture. Who carved them, and why they left, remains debated."
        ),
        HiddenSite(
            "matsushiro", "Matsushiro Underground HQ", "Zōzan bunkers",
            "Japan", "Nagano", "Asia", SiteType.BUNKER,
            36.5581, 138.2011,
            "Dug in the final months of WWII, 1944–1945",
            "About 10 km of tunnels intended to hide Japan's wartime government",
            Access.PUBLIC_TOUR,
            "A secret WWII tunnel city meant to shelter Japan's emperor and command.",
            "Blasted into three mountains by forced labourers, the entrances were kept secret so the whole government could vanish inside.",
            "As defeat neared, Japan drove kilometres of tunnels under Matsushiro to relocate the imperial headquarters, palace and broadcasting. Left unfinished at the war's end, part of the raw rock tunnels can now be walked."
        ),
        HiddenSite(
            "oya", "Ōya Underground Quarry", "Ōya History Museum",
            "Japan", "Utsunomiya, Tochigi", "Asia", SiteType.MINE,
            36.6389, 139.8286,
            "Quarried from the early 20th century",
            "A cathedral-like void about 20,000 m², up to 60 m deep",
            Access.PUBLIC_TOUR,
            "A vast man-made cavern left by a century of underground stone quarrying.",
            "A staircase drops from a small museum building into a colossal chilled chamber hidden entirely below ground.",
            "The soft Ōya stone was cut from below for decades, leaving an immense underground hall used in wartime as a secret factory and now for concerts and film sets. The temperature stays near freezing year-round."
        ),
        HiddenSite(
            "gcans", "G-Cans Discharge Channel", "Metropolitan Area Outer Underground Discharge Channel",
            "Japan", "Kasukabe, Saitama", "Asia", SiteType.TUNNEL_NETWORK,
            35.9979, 139.8110,
            "Completed 2006",
            "6.3 km of tunnels and a 25 m-tall pillared water tank",
            Access.GUIDED_ONLY,
            "A cathedral-like flood-control tunnel city beneath Tokyo's suburbs.",
            "Tours descend a long stair into the \"underground temple\", a vast tank held up by 59 giant concrete pillars.",
            "Built to stop Tokyo flooding, G-Cans links huge silos to a pillared surge tank the size of a cathedral, then pumps storm water to a river. When dry it looks like a subterranean temple and is open for tours."
        ),
        HiddenSite(
            "ellora", "Kailasa Temple, Ellora", "Cave 16",
            "India", "Maharashtra", "Asia", SiteType.ROCK_CITY,
            20.0263, 75.1779,
            "Carved in the 8th century under the Rashtrakutas",
            "34 rock-cut cave temples; Kailasa carved from a single rock",
            Access.PUBLIC_TOUR,
            "A temple complex chiselled top-down from solid basalt cliffs.",
            "The complex is entered through a rock gateway; the temples were excavated downward from the hillside rather than built up.",
            "Ellora's 34 Hindu, Buddhist and Jain temples were carved into a basalt escarpment. The Kailasa temple was cut from the top down out of one rock, removing some 200,000 tonnes of stone to leave a full temple standing in a quarried pit."
        ),
        HiddenSite(
            "ajanta", "Ajanta Caves", null,
            "India", "Maharashtra", "Asia", SiteType.ROCK_CITY,
            20.5519, 75.7003,
            "Carved from ~2nd century BC to ~5th century AD",
            "30 rock-cut Buddhist monasteries and halls",
            Access.PUBLIC_TOUR,
            "Buddhist monastery-caves carved into a horseshoe cliff, lost for centuries.",
            "Cut high into a river gorge's cliff, the caves were abandoned and hidden by jungle until a British hunting party stumbled on them in 1819.",
            "The Ajanta caves are prayer halls and monasteries hewn into a curving basalt cliff above the Waghur River, famous for luminous murals of the Buddha's lives. Forgotten for over a thousand years, they were rediscovered by accident."
        ),
        HiddenSite(
            "barabar", "Barabar Caves", null,
            "India", "Bihar", "Asia", SiteType.CAVE_SYSTEM,
            25.0058, 85.0631,
            "Mauryan era, 3rd century BC",
            "The oldest surviving rock-cut caves in India",
            Access.PUBLIC_TOUR,
            "Mirror-polished chambers cut into granite, echoing eerily inside.",
            "Plain rectangular doorways cut into granite domes open into perfectly smooth, resonant halls.",
            "The Barabar caves were carved from solid granite and polished to a glassy shine, producing a striking echo. Dedicated to the ascetic Ajivika sect under Emperor Ashoka, they inspired the \"Marabar Caves\" of A Passage to India."
        ),
        HiddenSite(
            "vinh_moc", "Vịnh Mốc Tunnels", null,
            "Vietnam", "Quảng Trị", "Asia", SiteType.TUNNEL_NETWORK,
            17.0447, 107.0736,
            "Dug during the Vietnam War, 1965–1967",
            "About 2 km on three levels, 10–23 m deep",
            Access.PUBLIC_TOUR,
            "A tunnel village where a whole community lived through years of bombing.",
            "Entrances hidden in the hillside and along the coast let villagers slip underground; some open straight onto the sea.",
            "To survive relentless bombing, the people of Vịnh Mốc dug a complete underground village with family niches, a well, a clinic and a maternity room where seventeen children were born. Three levels descend toward the shore."
        ),
        HiddenSite(
            "cu_chi", "Củ Chi Tunnels", null,
            "Vietnam", "Ho Chi Minh City", "Asia", SiteType.TUNNEL_NETWORK,
            11.1436, 106.4600,
            "Dug in the 1940s, vastly expanded in the 1960s",
            "About 250 km on up to three levels",
            Access.PUBLIC_TOUR,
            "A hand-dug guerrilla underworld with kitchens, hospitals and hidden hatches.",
            "Entrances were tiny leaf-covered trapdoors barely shoulder-width, often beside decoy termite mounds used as vents.",
            "The Củ Chi tunnels formed a self-contained world of quarters, hospitals, armouries and kitchens whose smoke vented far away. Narrow passages with false floors and traps let whole communities live below ground for years."
        ),
        HiddenSite(
            "son_doong", "Sơn Đoòng Cave", null,
            "Vietnam", "Phong Nha-Kẻ Bàng", "Asia", SiteType.CAVE_SYSTEM,
            17.4547, 106.2870,
            "Formed 2–5 million years ago",
            "The largest known cave passage on Earth, over 5 km long",
            Access.GUIDED_ONLY,
            "The world's largest cave, with its own jungle, clouds and river.",
            "The entrance is a jungle-hidden shaft a local man found in 1990 and could not re-locate for years; it was surveyed only in 2009.",
            "Sơn Đoòng is so vast that collapsed ceilings (dolines) let sunlight in to grow an underground jungle, and clouds form inside it. Passages soar high enough to hold a skyscraper, threaded by a subterranean river."
        ),
        HiddenSite(
            "third_tunnel", "Third Tunnel of Aggression", null,
            "South Korea", "Demilitarized Zone", "Asia", SiteType.TUNNEL_NETWORK,
            37.9500, 126.7000,
            "Discovered 1978",
            "1.6 km long, 73 m deep, cut toward Seoul",
            Access.PUBLIC_TOUR,
            "A secret infiltration tunnel dug under the DMZ toward Seoul.",
            "North Korea bored it through granite and, when found, painted the walls black to claim it was a coal mine.",
            "One of several tunnels dug under the border to move troops south, the Third Tunnel was found after a defector's tip. Wide enough to pass thousands of soldiers an hour, it now ends at concrete barricades open to visitors."
        ),
        HiddenSite(
            "vieng_xai", "Vieng Xai Caves", null,
            "Laos", "Houaphanh Province", "Asia", SiteType.CAVE_SYSTEM,
            20.4114, 104.2039,
            "Used 1964–1973 during the Laotian civil war",
            "Over 450 caves that sheltered around 20,000 people",
            Access.GUIDED_ONLY,
            "A hidden cave city where a whole society sheltered from years of bombing.",
            "The natural limestone caves were enlarged and their entrances screened, hiding an entire wartime capital from the air.",
            "As Laos was bombed relentlessly, the Pathet Lao leadership and thousands of civilians lived in the caves of Vieng Xai — with a hospital, schools, shops, a theatre and even a wedding hall carved into the karst."
        ),
        HiddenSite(
            "bet_guvrin", "Bet Guvrin-Maresha Bell Caves", null,
            "Israel", "Judean Lowlands", "Asia", SiteType.CAVE_SYSTEM,
            31.6136, 34.8969,
            "Quarried from Hellenistic to early Islamic times",
            "Around 3,500 chambers beneath two ancient towns",
            Access.PUBLIC_TOUR,
            "A landscape so honeycombed it is called the land of a thousand caves.",
            "Small openings in the chalk plain drop into vast bell-shaped chambers quarried out below.",
            "Beneath Bet Guvrin and Maresha lies a warren of quarries, cisterns, columbaria, oil presses and hideouts cut into soft chalk, including huge bell caves. The area is a UNESCO World Heritage Site."
        ),
        HiddenSite(
            "western_wall_tunnels", "Western Wall Tunnels", null,
            "Israel", "Jerusalem", "Asia", SiteType.TUNNEL_NETWORK,
            31.7784, 35.2342,
            "Herodian construction, ~1st century BC",
            "Tunnels running the full hidden length of the Western Wall",
            Access.GUIDED_ONLY,
            "Excavated passages exposing the buried base of the Temple Mount wall.",
            "A stairway from the Western Wall plaza leads into tunnels following the wall deep beneath the Old City's streets.",
            "These tunnels expose courses of the Herodian retaining wall hidden underground for centuries, including one of the largest building stones ever used. They run past ancient streets, cisterns and an aqueduct beneath the Muslim Quarter."
        ),
        HiddenSite(
            "zedekiah", "Zedekiah's Cave", "Solomon's Quarries",
            "Israel", "Jerusalem", "Asia", SiteType.CAVE_SYSTEM,
            31.7819, 35.2314,
            "Quarried since ancient times",
            "A quarry cave extending ~200 m under the Old City",
            Access.PUBLIC_TOUR,
            "A vast quarry cavern reaching under Jerusalem's walls, wrapped in legend.",
            "The entrance is a low opening in the Old City wall below the Damascus Gate, hiding a huge chamber behind it.",
            "This man-made cave supplied stone for Jerusalem's monuments, and tradition ties it to Solomon and to King Zedekiah's flight from the Babylonians. It stretches deep beneath the Muslim Quarter."
        ),
        HiddenSite(
            "petra", "Petra", "Raqmu",
            "Jordan", "Ma'an Governorate", "Asia", SiteType.ROCK_CITY,
            30.3285, 35.4444,
            "Nabataean capital from ~4th century BC",
            "Hundreds of tombs, temples and halls carved into rose sandstone",
            Access.PUBLIC_TOUR,
            "A rose-red city of façades and chambers cut into desert canyon walls.",
            "The only grand approach is the Siq, a narrow kilometre-long rock cleft that opens dramatically before the carved Treasury.",
            "Petra was the Nabataeans' caravan capital, its monuments hewn from sandstone cliffs. Behind the famous façades lie carved chambers, cisterns and a hydraulic system that let a city thrive in the desert. It was hidden from the West until 1812."
        ),
        HiddenSite(
            "hegra", "Hegra", "Madain Salih",
            "Saudi Arabia", "Al-Ula", "Asia", SiteType.ROCK_CITY,
            26.7917, 37.9542,
            "Nabataean, 1st century BC to 1st century AD",
            "Over 100 monumental rock-cut tombs",
            Access.GUIDED_ONLY,
            "The Nabataeans' second city, its tombs carved into desert sandstone outcrops.",
            "Ornate doorways cut into isolated sandstone hills open into burial chambers hollowed from the rock.",
            "Hegra was the southern city of the Nabataeans, sharing Petra's rock-cut architecture. Saudi Arabia's first UNESCO World Heritage Site, its carved tombs stand almost untouched amid the dunes of Al-Ula."
        ),
        HiddenSite(
            "bamiyan", "Bamiyan Caves", null,
            "Afghanistan", "Bamyan Province", "Asia", SiteType.CAVE_DWELLING,
            34.8300, 67.8256,
            "Buddhist complex, ~3rd–8th centuries AD",
            "Hundreds of caves around the niches of the lost Buddhas",
            Access.RESTRICTED,
            "A cliff riddled with monastic caves beside the destroyed giant Buddhas.",
            "Openings pock the cliff around the empty Buddha niches; many caves interconnect behind the rock face.",
            "The Bamiyan cliff held two colossal standing Buddhas (destroyed in 2001) and a honeycomb of painted monastic caves along the Silk Road. Some chambers preserve among the earliest known oil paintings."
        ),
        HiddenSite(
            "darvaza", "Darvaza Gas Crater", "Door to Hell",
            "Turkmenistan", "Karakum Desert", "Asia", SiteType.MYTH_GATEWAY,
            40.2525, 58.4394,
            "Ignited around 1971",
            "A burning crater about 70 m across and 20 m deep",
            Access.PUBLIC_TOUR,
            "A fiery pit in the desert that has burned for over half a century.",
            "The way in is a walk across open desert to the rim of a flaming crater glowing like a doorway into the earth.",
            "When a gas-drilling site collapsed, engineers set the escaping methane alight expecting it to burn out in weeks; it has blazed ever since. Its glow in the empty Karakum earned the nickname the \"Door to Hell\"."
        ),
        HiddenSite(
            "batu", "Batu Caves", null,
            "Malaysia", "Selangor", "Asia", SiteType.CAVE_SYSTEM,
            3.2379, 101.6840,
            "Limestone ~400 million years old; shrine since 1890s",
            "A vast Temple Cave reached by 272 steps",
            Access.PUBLIC_TOUR,
            "A towering limestone cavern turned Hindu temple above Kuala Lumpur.",
            "A giant golden statue guards a rainbow staircase of 272 steps climbing to the cave mouth in the cliff.",
            "Batu Caves is a series of limestone caverns holding Hindu shrines, the largest a cathedral-sized \"Temple Cave\". It is the focus of the Thaipusam festival, when huge crowds climb the painted stairway."
        ),
        HiddenSite(
            "dambulla", "Dambulla Cave Temple", "Golden Temple of Dambulla",
            "Sri Lanka", "Central Province", "Asia", SiteType.CAVE_SYSTEM,
            7.8567, 80.6492,
            "A shrine since the 1st century BC",
            "Five caves under a rock overhang, richly painted",
            Access.PUBLIC_TOUR,
            "Painted cave shrines beneath a giant rock, crowded with Buddha statues.",
            "A climb up a rock leads to a row of low cave mouths under an overhang, opening into shrine halls.",
            "Dambulla is the best-preserved cave temple complex in Sri Lanka, its ceilings and walls covered in murals and its chambers filled with over 150 Buddha images. A king who sheltered here in exile founded the shrines in thanks."
        ),
        HiddenSite(
            "mustang_caves", "Upper Mustang Sky Caves", "Chhoser caves",
            "Nepal", "Mustang District", "Asia", SiteType.CAVE_DWELLING,
            29.1900, 83.9700,
            "Dug from around 3,000 years ago onward",
            "Thousands of caves bored high into sheer cliffs",
            Access.GUIDED_ONLY,
            "Thousands of mysterious man-made caves riddling Himalayan cliffs.",
            "The openings are dizzyingly high on vertical cliff faces, reached by rickety ladders — how they were first cut is uncertain.",
            "The sky caves of Mustang honeycomb the cliffs of the former Kingdom of Lo, used over millennia as burial chambers, dwellings and meditation cells. Some contain ancient bodies, murals and Buddhist manuscripts."
        )
    )

    // -------------------------------------------------------------- EUROPE ---

    private val europe = listOf(
        HiddenSite(
            "wieliczka", "Wieliczka Salt Mine", null,
            "Poland", "Wieliczka, near Kraków", "Europe", SiteType.MINE,
            49.9835, 20.0546,
            "Mined continuously from the 13th century",
            "9 levels, about 327 m deep, ~287 km of galleries",
            Access.PUBLIC_TOUR,
            "A subterranean realm of salt with chapels, lakes and carved cathedrals.",
            "Visitors descend a wooden staircase of nearly 400 steps down a mine shaft into the salt world.",
            "Over seven centuries miners hollowed Wieliczka into brine lakes, chandeliered halls and the breathtaking Chapel of St. Kinga — a church, altarpieces and all, carved from rock salt more than 300 m down."
        ),
        HiddenSite(
            "bochnia", "Bochnia Salt Mine", null,
            "Poland", "Bochnia", "Europe", SiteType.MINE,
            49.9690, 20.4300,
            "Poland's oldest salt mine, from the 13th century",
            "Around 4.5 km of accessible tunnels, down to ~330 m",
            Access.PUBLIC_TOUR,
            "The oldest salt mine in Poland, with an underground boat ride and chapel.",
            "A shaft lift drops visitors into galleries where a brine lake is crossed by boat far below ground.",
            "Older even than Wieliczka, Bochnia holds salt-carved chapels, a 140 m underground slide, a subterranean lake and a chamber used as a sanatorium. People even stay overnight in the salt air."
        ),
        HiddenSite(
            "osowka", "Osówka Complex", "Project Riese",
            "Poland", "Owl Mountains, Lower Silesia", "Europe", SiteType.BUNKER,
            50.6667, 16.4667,
            "Dug 1943–1945 by Nazi Germany",
            "Kilometres of unfinished tunnels under the mountains",
            Access.GUIDED_ONLY,
            "Unfinished Nazi tunnels beneath a mountain, purpose still mysterious.",
            "Concrete portals hidden in the forested Owl Mountains lead into raw, flooded rock tunnels.",
            "Osówka is the most complete part of Project Riese, a huge secret Nazi tunnel scheme abandoned in 1945. Whether it was meant as a headquarters, weapons plant or bunker is still debated, fuelling treasure legends."
        ),
        HiddenSite(
            "naours", "Cité Souterraine de Naours", "Underground City of Naours",
            "France", "Somme, Hauts-de-France", "Europe", SiteType.UNDERGROUND_CITY,
            50.0192, 2.2733,
            "Enlarged from medieval times through the 17th century",
            "About 2 km of galleries, ~300 rooms, 33 m down",
            Access.PUBLIC_TOUR,
            "A quarry turned refuge city that hid whole villages during raids.",
            "Entrances were hidden in the forest as quarry \"muches\" (hiding holes), and chimney smoke was vented through a farmhouse.",
            "Beneath a beech wood, Naours grew into an underground town with squares, chapels and stables for around 3,000 people. Forgotten for a century, it reopened in 1887; WWI soldiers left thousands of graffiti on its walls."
        ),
        HiddenSite(
            "paris_catacombs", "Catacombs of Paris", "Les Catacombes",
            "France", "Paris", "Europe", SiteType.TUNNEL_NETWORK,
            48.8338, 2.3324,
            "Quarries from the 13th c.; ossuary from 1786",
            "About 300 km of tunnels citywide, ~20 m down",
            Access.PUBLIC_TOUR,
            "A quarry labyrinth beneath Paris lined with the bones of millions.",
            "The official door is small and dark near Denfert-Rochereau, but \"cataphiles\" slip into the forbidden network through manholes and hatches.",
            "The Catacombs occupy former limestone quarries whose stone built Paris above. From 1786 the remains of some six million people were stacked here into walls of skulls and bones. Only a short sanctioned loop is open."
        ),
        HiddenSite(
            "provins", "Provins Underground Galleries", "souterrains de Provins",
            "France", "Seine-et-Marne", "Europe", SiteType.TUNNEL_NETWORK,
            48.5606, 3.2986,
            "Dug from the medieval fairs era",
            "A network of cellars and tunnels under the old town",
            Access.GUIDED_ONLY,
            "Medieval quarry-cellars honeycombing the hill of a fair town.",
            "An entrance beneath a former church leads into graffiti-covered galleries cut into the tuffeau below Provins.",
            "The merchants of Provins, a great medieval fair town, extended cellars and quarries into the soft rock beneath the upper town. The walls bear centuries of carved marks left by visitors and workers."
        ),
        HiddenSite(
            "jonas", "Grottes de Jonas", null,
            "France", "Auvergne", "Europe", SiteType.CAVE_DWELLING,
            45.5333, 2.9833,
            "Inhabited from the early Middle Ages",
            "Dozens of rooms and a chapel carved into a tuff cliff",
            Access.PUBLIC_TOUR,
            "A cliff village of rock rooms, stairways and a frescoed chapel.",
            "Doorways and windows dot a volcanic cliff face, with rock-cut stairs linking the levels inside.",
            "The Grottes de Jonas are a troglodyte settlement in Auvergne with living quarters, stables, a bakery and a chapel painted with rare Romanesque frescoes, all carved into soft volcanic tuff."
        ),
        HiddenSite(
            "barry", "Barry Troglodyte Village", null,
            "France", "Bollène, Provence", "Europe", SiteType.CAVE_DWELLING,
            44.3167, 4.7333,
            "Inhabited since prehistory, abandoned in the 20th c.",
            "A cliffside of rock homes above the Rhône valley",
            Access.RESTRICTED,
            "An abandoned cliff village of caves overlooking the Rhône.",
            "Rock-cut doorways and window holes riddle the cliff, with the dwellings tunnelled back into the stone.",
            "Barry was a troglodyte village whose inhabitants carved homes, cisterns and silos into the rock over centuries, only leaving in the last century. Its ruins and cave rooms cling to the hillside."
        ),
        HiddenSite(
            "naples_underground", "Napoli Sotterranea", "Naples Underground",
            "Italy", "Naples, Campania", "Europe", SiteType.TUNNEL_NETWORK,
            40.8500, 14.2600,
            "Greek quarries from ~4th c. BC, reused ever since",
            "A tuff labyrinth of quarries, aqueducts and cisterns, ~40 m down",
            Access.GUIDED_ONLY,
            "A layered underworld of aqueducts and war shelters beneath Naples.",
            "Narrow stairs from a city courtyard drop into ancient quarries later used as an aqueduct and WWII bomb shelter.",
            "Beneath Naples lies a vast void quarried from tuff by the Greeks, turned into a Roman aqueduct, then a network of cisterns and finally air-raid shelters. Sections still hold wartime relics and even a hidden Roman theatre."
        ),
        HiddenSite(
            "narni", "Narni Underground", "Narni Sotterranea",
            "Italy", "Umbria", "Europe", SiteType.TUNNEL_NETWORK,
            42.5197, 12.5153,
            "Medieval; rediscovered in 1979",
            "Chapels, cisterns and Inquisition cells hidden under the town",
            Access.GUIDED_ONLY,
            "A frescoed church and secret Inquisition prison hidden under a hill town.",
            "Young cavers broke through a garden wall in 1979 and found a lost frescoed church and cells behind it.",
            "Narni Sotterranea revealed a 12th-century frescoed church, a Roman cistern, and a chilling Inquisition tribunal and cell whose walls are covered in a prisoner's coded graffiti — all sealed and forgotten for centuries."
        ),
        HiddenSite(
            "osimo", "Osimo Caves", "Grotte di Osimo",
            "Italy", "Marche", "Europe", SiteType.TUNNEL_NETWORK,
            43.4858, 13.4833,
            "Carved over many centuries",
            "Kilometres of tunnels and carved chambers under the town",
            Access.GUIDED_ONLY,
            "A hill town honeycombed with mysterious carved tunnels and symbols.",
            "Cellars beneath ordinary palazzi open into passages carved with bas-reliefs whose meaning is debated.",
            "The sandstone beneath Osimo is riddled with hand-cut tunnels and chambers, some adorned with esoteric symbols and templar-style carvings, used as refuges, stores and reputedly for secret societies."
        ),
        HiddenSite(
            "matera", "Sassi di Matera", "I Sassi",
            "Italy", "Basilicata", "Europe", SiteType.CAVE_DWELLING,
            40.6664, 16.6115,
            "Among the oldest inhabited settlements, ~9,000 years",
            "Two districts of cave homes terraced into a ravine",
            Access.PUBLIC_TOUR,
            "Ancient cave homes stacked into a ravine, one roof the next one's street.",
            "Behind carved façades the rooms bore deep into tufa; below lies the cathedral-sized Palombaro Lungo cistern.",
            "The Sassi are dwellings, churches and workshops carved into a tufa ravine, so densely layered that streets run over rooftops. Emptied as slums in the 1950s, they are now a UNESCO World Heritage Site."
        ),
        HiddenSite(
            "orvieto", "Orvieto Underground", "Orvieto Sotterranea",
            "Italy", "Umbria", "Europe", SiteType.TUNNEL_NETWORK,
            42.7185, 12.1109,
            "Etruscan origins, extended over ~2,500 years",
            "About 1,200 caves, wells and tunnels inside a tufa plateau",
            Access.GUIDED_ONLY,
            "A hidden city of caves and wells inside the cliff Orvieto sits on.",
            "Cellar doors in the cliff-top town drop into Etruscan wells, olive mills and dovecotes bored through the rock.",
            "Orvieto perches on tufa its people have burrowed for 2,500 years, creating some 1,200 cavities — wells, quarries, presses and refuge tunnels. In sieges the population could live and work entirely within the rock."
        ),
        HiddenSite(
            "setenil", "Setenil de las Bodegas", null,
            "Spain", "Cádiz, Andalusia", "Europe", SiteType.CAVE_DWELLING,
            36.8639, -5.1806,
            "Cave dwellings since prehistory; town from ~12th c.",
            "Houses tucked under a huge overhanging rock along a gorge",
            Access.PUBLIC_TOUR,
            "A town built into the underside of a cliff along a river gorge.",
            "House fronts vanish under the living rock; the street's ceiling is a single vast boulder.",
            "Setenil grew inside the gorge of the Río Trejo, where townsfolk enclosed rock overhangs to make homes and bodegas whose roofs are the cliff itself, blurring the line between cave and house."
        ),
        HiddenSite(
            "guadix", "Guadix Cave Houses", "Barrio de las Cuevas",
            "Spain", "Granada, Andalusia", "Europe", SiteType.CAVE_DWELLING,
            37.3000, -3.1333,
            "Inhabited since at least the 16th century",
            "Thousands of cave homes, one of Europe's largest cave quarters",
            Access.PUBLIC_TOUR,
            "A whole quarter of whitewashed cave homes with chimneys poking from hills.",
            "Only white doorways and chimneys mark the hills; the homes tunnel back into the soft clay behind them.",
            "In Guadix, thousands of people still live in cave houses dug into the clay badlands, cool in summer and warm in winter. From above, only chimneys and doors betray the neighbourhood hidden inside the hills."
        ),
        HiddenSite(
            "sacromonte", "Sacromonte Caves", null,
            "Spain", "Granada, Andalusia", "Europe", SiteType.CAVE_DWELLING,
            37.1817, -3.5847,
            "Roma cave dwellings from the 15th century",
            "Whitewashed caves terraced up a hillside",
            Access.PUBLIC_TOUR,
            "A hillside of cave homes, the historic heart of Granada's flamenco.",
            "Cave doorways open from the terraced lanes of the hill facing the Alhambra.",
            "Sacromonte's caves were long home to Granada's Roma community and became the birthplace of the zambra flamenco. Many caves are still lived in or used as venues, tunnelled into the hillside opposite the Alhambra."
        ),
        HiddenSite(
            "nottingham_caves", "City of Caves", null,
            "United Kingdom", "Nottingham, England", "Europe", SiteType.CAVE_SYSTEM,
            52.9520, -1.1490,
            "Dug from the medieval period onward",
            "Over 800 man-made sandstone caves under the city",
            Access.PUBLIC_TOUR,
            "Hundreds of hand-carved caves riddling the sandstone under Nottingham.",
            "Entrances hide in cellars, a shopping centre and hillsides, opening into tanneries, cellars and shelters.",
            "Nottingham sits on soft sandstone that residents have carved for a thousand years into cellars, a medieval tannery, malt kilns, dwellings and WWII air-raid shelters — over 800 caves in all."
        ),
        HiddenSite(
            "williamson", "Williamson Tunnels", null,
            "United Kingdom", "Liverpool, England", "Europe", SiteType.TUNNEL_NETWORK,
            53.4000, -2.9550,
            "Built in the early 19th century",
            "A labyrinth of brick and stone tunnels of unknown extent",
            Access.PUBLIC_TOUR,
            "A maze of pointless-looking tunnels dug by an eccentric philanthropist.",
            "The tunnels open from cellars and a heritage centre in the Edge Hill district, much of the network still buried and unexplored.",
            "Retired merchant Joseph Williamson employed gangs to dig an elaborate warren of tunnels beneath Liverpool in the 1800s, for reasons never explained — charity work, folly, or secret purpose. Volunteers are still clearing them."
        ),
        HiddenSite(
            "chislehurst", "Chislehurst Caves", null,
            "United Kingdom", "Kent, England", "Europe", SiteType.MINE,
            51.4126, 0.0592,
            "Chalk mining over centuries",
            "About 35 km of man-made tunnels",
            Access.PUBLIC_TOUR,
            "Miles of old chalk-mine tunnels that sheltered thousands in the Blitz.",
            "A single unassuming entrance in the Kent hills leads into tens of kilometres of dark passages.",
            "Dug for chalk and flint, the Chislehurst tunnels became a vast air-raid shelter in WWII, housing up to 15,000 people with its own chapel and hospital. Later they hosted 1960s rock concerts."
        ),
        HiddenSite(
            "hellfire", "Hellfire Caves", "West Wycombe Caves",
            "United Kingdom", "Buckinghamshire, England", "Europe", SiteType.TUNNEL_NETWORK,
            51.6440, -0.8080,
            "Excavated in the 1740s–1750s",
            "Chalk tunnels running ~500 m into a hill",
            Access.PUBLIC_TOUR,
            "Tunnels dug for a notorious gentlemen's club of scandalous rituals.",
            "A gothic flint entrance in the hillside leads down past an \"River Styx\" to a deep Inner Temple.",
            "Sir Francis Dashwood had these chalk caves carved to host his \"Hellfire Club\", whose members held mock-pagan revels far underground. The passages descend past themed chambers to a chamber beneath a church."
        ),
        HiddenSite(
            "dover_tunnels", "Dover Castle Secret Tunnels", null,
            "United Kingdom", "Dover, England", "Europe", SiteType.BUNKER,
            51.1295, 1.3213,
            "Napoleonic tunnels, expanded in WWII",
            "Multiple levels of tunnels inside the white cliffs",
            Access.PUBLIC_TOUR,
            "Cliff tunnels that ran the Dunkirk evacuation and hid a wartime hospital.",
            "Entrances cut into the white cliffs beneath the castle lead into a warren of command rooms and wards.",
            "Begun to barrack troops against Napoleon, the Dover cliff tunnels became the nerve centre for the 1940 Dunkirk evacuation and held an underground hospital and command HQ, sealed in the chalk of the cliffs."
        ),
        HiddenSite(
            "burlington", "Burlington Bunker", "Central Government War HQ",
            "United Kingdom", "Corsham, Wiltshire", "Europe", SiteType.BUNKER,
            51.4300, -2.1900,
            "Built in the 1950s inside a stone quarry",
            "About 1 km² of tunnels ~30 m down for ~4,000 people",
            Access.RESTRICTED,
            "A secret underground city to run Britain through a nuclear war.",
            "Hidden in disused Bath-stone quarries and reached through plain surface buildings, its existence was denied for decades.",
            "Codenamed Burlington, this Cold War complex was to house the government to run Britain after a nuclear strike, with a telephone exchange, BBC studio, hospital and underground lake. It was secret until declassified in 2004."
        ),
        HiddenSite(
            "edinburgh_vaults", "Edinburgh's South Bridge Vaults", "The Underground Vaults",
            "United Kingdom", "Edinburgh, Scotland", "Europe", SiteType.TUNNEL_NETWORK,
            55.9490, -3.1880,
            "Formed within South Bridge, completed 1788",
            "About 120 chambers hidden inside a bridge",
            Access.GUIDED_ONLY,
            "Vaults sealed inside a bridge, later a hidden slum underworld.",
            "The chambers are buried inside the arches of South Bridge — invisible from the street above.",
            "South Bridge's arches enclosed vaults used first as workshops, then as squalid dwellings and taverns. Sealed and forgotten for over a century, they were rediscovered in the 1980s and are toured for their dark history."
        ),
        HiddenSite(
            "znojmo", "Znojmo Underground", "Znojemské podzemí",
            "Czech Republic", "South Moravia", "Europe", SiteType.TUNNEL_NETWORK,
            48.8555, 16.0488,
            "Dug from the 14th–15th centuries onward",
            "About 27 km of multi-level cellars under the old town",
            Access.GUIDED_ONLY,
            "A multi-level medieval passage city beneath a Moravian town.",
            "It began as house cellars residents secretly dug and connected until the ground became a hidden labyrinth.",
            "Townsfolk of Znojmo extended cellars downward for centuries until they merged into one of Central Europe's largest underground networks — some 27 km on up to four levels, with wells, smoke traps and escape routes."
        ),
        HiddenSite(
            "nuremberg", "Nuremberg Rock-Cut Cellars", "Felsengänge",
            "Germany", "Nuremberg, Bavaria", "Europe", SiteType.TUNNEL_NETWORK,
            49.4550, 11.0800,
            "Cut from the 14th century",
            "Four-storey cellar passages under the old town",
            Access.GUIDED_ONLY,
            "Beer cellars carved in sandstone that hid the city's art treasures.",
            "Stairs from a brewery drop into sandstone passages that also concealed a wartime art bunker.",
            "The Felsengänge are a warren of sandstone cellars dug for brewing and storage. In WWII a climate-controlled \"art bunker\" within them safeguarded treasures including the Nuremberg crown jewels."
        ),
        HiddenSite(
            "oppenheim", "Oppenheim Cellar Labyrinth", "Kellerlabyrinth",
            "Germany", "Rhineland-Palatinate", "Europe", SiteType.TUNNEL_NETWORK,
            49.8556, 8.3606,
            "Dug from the Middle Ages",
            "Multiple levels of cellars linking the whole town",
            Access.GUIDED_ONLY,
            "A hidden multi-level cellar city beneath a Rhine wine town.",
            "Trapdoors and cellar stairs in ordinary houses connect into a maze running under the streets.",
            "Beneath Oppenheim lies a labyrinth of interlinked cellars and passages dug over centuries for wine storage and refuge. Much remains unmapped under the historic town."
        ),
        HiddenSite(
            "hallstatt", "Hallstatt Salt Mine", "Salzwelten",
            "Austria", "Salzkammergut", "Europe", SiteType.MINE,
            47.5556, 13.6444,
            "The world's oldest known salt mine, ~7,000 years",
            "Ancient galleries high in the Alps above Hallstatt",
            Access.PUBLIC_TOUR,
            "The oldest salt mine on Earth, reached by a mountain funicular and slides.",
            "The entrance sits high above the lake; miners' wooden slides carry visitors down between the galleries.",
            "Salt has been mined at Hallstatt since the Bronze Age, giving its name to an entire prehistoric culture. The tunnels have preserved ancient tools, a wooden staircase over 3,000 years old, and even a prehistoric miner."
        ),
        HiddenSite(
            "buda_labyrinth", "Buda Castle Labyrinth", "Budavári Labirintus",
            "Hungary", "Budapest", "Europe", SiteType.TUNNEL_NETWORK,
            47.4967, 19.0347,
            "Natural caves used since prehistory, linked over centuries",
            "About 1,200 m of caves and cellars under Castle Hill",
            Access.PUBLIC_TOUR,
            "A cave labyrinth beneath Buda Castle, prison to the real Dracula.",
            "Entrances from the Castle District streets lead into thermal caves later joined into a single maze.",
            "Under Buda Castle Hill, thermal springs carved caves that were linked into cellars, wells and shelters over centuries. Tradition holds that Vlad the Impaler — the inspiration for Dracula — was imprisoned here."
        ),
        HiddenSite(
            "turda", "Salina Turda", "Turda Salt Mine",
            "Romania", "Transylvania", "Europe", SiteType.MINE,
            46.5875, 23.7869,
            "Mined from the Middle Ages to 1932",
            "Huge salt chambers, one over 100 m deep",
            Access.PUBLIC_TOUR,
            "A cavernous old salt mine turned surreal underground theme park.",
            "A gallery entrance in the hillside leads to a lift and stairs down into vast echoing salt chambers.",
            "After centuries of salt mining, Turda's colossal chambers now hold a Ferris wheel, boating lake, amphitheatre and mini-golf far underground, lit against glistening salt walls — a science-fiction landscape below Transylvania."
        ),
        HiddenSite(
            "odessa", "Odessa Catacombs", null,
            "Ukraine", "Odessa", "Europe", SiteType.TUNNEL_NETWORK,
            46.4830, 30.7326,
            "Formed by limestone quarrying in the 19th century",
            "The world's longest urban catacombs, roughly 2,500 km",
            Access.RESTRICTED,
            "The world's largest catacomb network, mostly unmapped and off-limits.",
            "Countless entrances open in cellars, quarry mouths and the countryside; most of the maze is unmarked and dangerous.",
            "Quarrying the stone that built Odessa left an enormous labyrinth beneath and around the city. It sheltered smugglers and WWII partisans, and remains so vast and poorly mapped that explorers still get lost — sometimes fatally."
        ),
        HiddenSite(
            "kyiv_lavra", "Kyiv Pechersk Lavra Caves", "Monastery of the Caves",
            "Ukraine", "Kyiv", "Europe", SiteType.CAVE_SYSTEM,
            50.4347, 30.5578,
            "Monastic caves from 1051 AD",
            "Networks of narrow tunnels holding mummified monks",
            Access.PUBLIC_TOUR,
            "Ancient monastery tunnels lined with the naturally preserved bodies of monks.",
            "Low candle-lit passages descend from the monastery churches into the Near and Far Caves.",
            "The Lavra's monks dug cells and chapels into the hillside from the 11th century, and were later buried in the caves, where the cool, dry air preserved their bodies. Pilgrims still file through the narrow tunnels."
        ),
        HiddenSite(
            "metro2", "Moscow Metro-2", "D-6",
            "Russia", "Moscow", "Europe", SiteType.TUNNEL_NETWORK,
            55.7500, 37.6200,
            "Reputedly begun under Stalin",
            "An alleged secret metro deeper than the public system",
            Access.RESTRICTED,
            "A rumoured secret government metro running beneath Moscow's public lines.",
            "Its portals, if real, are hidden within government sites and deep sections of the ordinary Metro.",
            "Metro-2 is a long-rumoured secret rail system said to connect the Kremlin and government bunkers deep below Moscow. Officially unconfirmed, it is one of the world's most famous hidden-tunnel legends, partly corroborated by declassified hints."
        ),
        HiddenSite(
            "samara_bunker", "Stalin's Bunker", "Bunker Stalina",
            "Russia", "Samara", "Europe", SiteType.BUNKER,
            53.1959, 50.1000,
            "Built in secret in 1942",
            "A command bunker 37 m below the city",
            Access.PUBLIC_TOUR,
            "A deep WWII command bunker built for Stalin, secret for 50 years.",
            "The entrance hides inside an ordinary building; a deep shaft drops to Stalin's private chamber below.",
            "Built when Moscow seemed about to fall, this Samara bunker was a reserve command post for Stalin, sunk deeper than any metro. Its existence stayed secret until 1990, and it now opens as a museum."
        ),
        HiddenSite(
            "maastricht", "Maastricht Underground", "Caves of Mount Saint Peter",
            "Netherlands", "Maastricht, Limburg", "Europe", SiteType.MINE,
            50.8333, 5.6833,
            "Limestone (marl) quarried since Roman times",
            "Over 20,000 passages beneath a single hill",
            Access.GUIDED_ONLY,
            "A colossal quarry maze that hid people, art and secrets in wartime.",
            "Entrances in the flank of Sint-Pietersberg lead into a maze so complex a guide is essential.",
            "Centuries of quarrying soft marl left tens of thousands of interlinked passages under Mount Saint Peter. They served as refuges and, in WWII, hid Rembrandt's Night Watch and other masterpieces from the Nazis."
        ),
        HiddenSite(
            "falun", "Falun Mine", "Great Copper Mountain",
            "Sweden", "Dalarna", "Europe", SiteType.MINE,
            60.5997, 15.6142,
            "Worked from ~1,000 years ago until 1992",
            "A great open pit and deep galleries beneath it",
            Access.PUBLIC_TOUR,
            "A thousand-year copper mine that once produced most of Europe's copper.",
            "A tour descends by lift into damp galleries beneath the enormous collapse pit at the surface.",
            "For centuries Falun supplied a huge share of Europe's copper and gave the world \"Falu red\" paint. A UNESCO World Heritage Site, its deep timbered galleries and giant pit can be explored underground."
        ),
        HiddenSite(
            "hal_saflieni", "Ħal Saflieni Hypogeum", null,
            "Malta", "Paola", "Europe", SiteType.UNDERGROUND_CITY,
            35.8697, 14.5072,
            "Carved ~4000–2500 BC",
            "Three rock-cut levels down to about 11 m",
            Access.GUIDED_ONLY,
            "A prehistoric subterranean temple and necropolis carved from living rock.",
            "Hidden beneath ordinary houses, it was found by accident in 1902 during building work.",
            "The Hypogeum is a unique Neolithic underground complex of halls and chambers cut with stone tools, including an \"Oracle Room\" with uncanny acoustics. The remains of some 7,000 people were found within it."
        ),
        HiddenSite(
            "ark_bosnia", "ARK D-0", "Tito's Bunker",
            "Bosnia and Herzegovina", "Konjic", "Europe", SiteType.BUNKER,
            43.6500, 17.9600,
            "Built in secret 1953–1979",
            "About 6,500 m² of galleries inside a mountain",
            Access.GUIDED_ONLY,
            "Yugoslavia's top-secret nuclear bunker, hidden inside a hillside.",
            "Disguised behind three ordinary houses, blast doors lead into a horseshoe of underground rooms.",
            "This atomic war command bunker was built to shelter Tito and his inner circle, at vast secret cost. Kept classified for decades, it now houses a contemporary art project among its preserved Cold War rooms."
        ),
        HiddenSite(
            "dunmore", "Dunmore Cave", "Derc Ferna",
            "Ireland", "County Kilkenny", "Europe", SiteType.CAVE_SYSTEM,
            52.7383, -7.2447,
            "Known since at least the 9th century",
            "A series of chambers with large calcite formations",
            Access.PUBLIC_TOUR,
            "A limestone cave remembered in the annals for a Viking massacre.",
            "A modern stair descends from a visitor centre into chambers that once had a single dark natural entrance.",
            "The Annals record that Vikings killed around a thousand people at Dunmore in 928 AD; bones and Viking silver hoards found inside support the grim tale. Its calcite columns include one of Ireland's tallest."
        ),
        HiddenSite(
            "houska", "Houska Castle", "Gateway to Hell",
            "Czech Republic", "Central Bohemia", "Europe", SiteType.MYTH_GATEWAY,
            50.4903, 14.5361,
            "Built ~1270s over a rock fissure",
            "A castle chapel sealing a legendary bottomless pit",
            Access.PUBLIC_TOUR,
            "A Gothic castle said to have been built to cap a bottomless pit to Hell.",
            "The \"gateway\" is a fissure beneath the castle chapel, which legend says was built to seal it rather than to defend anything.",
            "Houska Castle has no water source, no defences and overlooks nothing — fuelling the legend it was raised only to cover a chasm from which demons crawled. The chapel is said to sit directly over the sealed pit."
        ),
        HiddenSite(
            "necromanteion", "Necromanteion of Acheron", null,
            "Greece", "Epirus", "Europe", SiteType.MYTH_GATEWAY,
            39.2361, 20.5344,
            "Ancient oracle site",
            "A rock-cut sanctuary above a dark vaulted crypt",
            Access.PUBLIC_TOUR,
            "An ancient oracle of the dead beside the mythical river of the underworld.",
            "Pilgrims passed through dark corridors and a labyrinth before descending to an underground crypt to meet the dead.",
            "The Necromanteion stood where the Acheron, mythic river of Hades, met the underworld. Seekers were led through disorienting passages and rituals to a vaulted crypt, believed to be the doorway through which the dead were summoned."
        ),
        HiddenSite(
            "tainaron", "Cave of Tainaron", "Cape Matapan",
            "Greece", "Mani, Peloponnese", "Europe", SiteType.MYTH_GATEWAY,
            36.3872, 22.4831,
            "Classical cult site",
            "A sea cave at Greece's southern tip",
            Access.PUBLIC_TOUR,
            "A sea cave the ancient Greeks named as an entrance to Hades.",
            "The gateway is a shallow sea cave near the ruins of a temple to Poseidon at the very tip of the Mani.",
            "At Cape Tainaron, the southernmost point of mainland Greece, a cave was revered as one of the entrances to the underworld — the route by which Heracles was said to have dragged up the hound Cerberus."
        ),
        HiddenSite(
            "alepotrypa", "Alepotrypa Cave", "Cave of the Fox",
            "Greece", "Diros, Mani", "Europe", SiteType.CAVE_SYSTEM,
            36.6394, 22.3806,
            "Inhabited in the Neolithic, ~6000–3000 BC",
            "A large cave with a lake, used as home and cemetery",
            Access.RESTRICTED,
            "A Neolithic cave that was home, cemetery and possibly a real \"Hades\".",
            "The cave lay sealed by an ancient earthquake until it was rediscovered in 1958 near the Diros sea caves.",
            "Alepotrypa sheltered a Neolithic community that lived, worshipped and buried its dead deep inside, around an underground lake. Some scholars think this dark, death-filled cavern helped inspire the Greek idea of the underworld."
        ),
        HiddenSite(
            "avernus", "Lake Avernus", "Lacus Avernus",
            "Italy", "Campania", "Europe", SiteType.MYTH_GATEWAY,
            40.8397, 14.0736,
            "Ancient volcanic crater lake",
            "A crater lake with nearby tunnels into the hillside",
            Access.PUBLIC_TOUR,
            "A volcanic crater lake the Romans called the entrance to the underworld.",
            "Nearby, the so-called Grotta di Cocceio and Sibyl's tunnels bore straight into the hills around the lake.",
            "Avernus, a still crater lake whose fumes were said to kill birds in flight, was the mythic gateway through which Aeneas descended to the underworld in Virgil's Aeneid. Roman engineers later drove real tunnels through the surrounding hills."
        ),
        HiddenSite(
            "st_patricks_purgatory", "St Patrick's Purgatory", "Station Island",
            "Ireland", "Lough Derg, County Donegal", "Europe", SiteType.MYTH_GATEWAY,
            54.6100, -7.8722,
            "Pilgrimage site since the medieval era",
            "A cave (now built over) said to reveal purgatory",
            Access.GUIDED_ONLY,
            "A pilgrimage island whose cave was believed to open onto purgatory itself.",
            "The original cave-pit on the island was where pilgrims were sealed in overnight to glimpse the afterlife; it was closed in 1632.",
            "Medieval Europe knew Lough Derg as the place where Christ showed St Patrick a cave revealing the torments of purgatory. Pilgrims still come to the island, though the fabled cave entrance was long ago sealed and built over."
        )
    )

    // -------------------------------------------------------------- AFRICA ---

    private val africa = listOf(
        HiddenSite(
            "matmata", "Matmata Troglodyte Dwellings", null,
            "Tunisia", "Gabès Governorate", "Africa", SiteType.CAVE_DWELLING,
            33.5443, 9.9715,
            "Berber pit-dwellings, centuries old",
            "Pit courtyards ~7 m deep with rooms cut from the walls",
            Access.PUBLIC_TOUR,
            "Berber homes sunk as craters into the earth, rooms bored from the pit walls.",
            "From the surface you see only round craters; a sloping tunnel leads down into each courtyard.",
            "The Berbers of Matmata dug circular pits and then carved rooms sideways into the walls, making cool homes hidden from heat and raiders. One dwelling famously played the Lars homestead in Star Wars."
        ),
        HiddenSite(
            "bulla_regia", "Bulla Regia", null,
            "Tunisia", "Jendouba Governorate", "Africa", SiteType.CAVE_DWELLING,
            36.5580, 8.7580,
            "Roman, 2nd–3rd century AD",
            "Villas with entire mosaic-floored storeys below ground",
            Access.PUBLIC_TOUR,
            "Roman villas that hid their finest rooms in a cool underground storey.",
            "Stairways descend from ground-floor atria into buried lower villas where the summer living happened.",
            "To beat the heat, wealthy Romans at Bulla Regia built subterranean storeys with columned courts and superb mosaics, preserved vividly because they were sealed underground. A staircase from a plain ruin reveals whole rooms below."
        ),
        HiddenSite(
            "chenini", "Chenini", null,
            "Tunisia", "Tataouine Governorate", "Africa", SiteType.CAVE_DWELLING,
            32.9167, 10.2667,
            "A fortified Berber village, medieval",
            "Cave homes and granaries terraced up a ridge",
            Access.PUBLIC_TOUR,
            "A hilltop Berber village of cave homes around a fortified granary.",
            "Rock-cut doorways climb the ridge to the ksar, whose vaulted cells stored the village's grain.",
            "Chenini's Berber families carved homes into the flanks of a steep ridge crowned by a hilltop ksar — a fortified communal granary of stacked vaulted rooms. The village clings dramatically to the arid mountainside."
        ),
        HiddenSite(
            "kom_el_shoqafa", "Catacombs of Kom el Shoqafa", null,
            "Egypt", "Alexandria", "Africa", SiteType.TUNNEL_NETWORK,
            31.1783, 29.8925,
            "Roman era, 2nd century AD",
            "Three levels of tombs cut ~35 m into the rock",
            Access.PUBLIC_TOUR,
            "A blended Greek-Roman-Egyptian necropolis spiralling deep underground.",
            "A spiral staircase winds down a shaft, once used to lower the dead on ropes, into the tomb levels.",
            "Discovered in 1900 (legend says when a donkey fell through), Kom el Shoqafa is Alexandria's largest Roman catacomb, its carvings fusing Egyptian, Greek and Roman styles across three descending levels."
        ),
        HiddenSite(
            "serapeum", "Serapeum of Saqqara", null,
            "Egypt", "Saqqara", "Africa", SiteType.TUNNEL_NETWORK,
            29.8721, 31.2144,
            "New Kingdom onward, from ~1300 BC",
            "Rock-cut galleries holding giant stone sarcophagi",
            Access.PUBLIC_TOUR,
            "Vast tunnels housing the granite coffins of sacred Apis bulls.",
            "A hillside doorway at Saqqara leads into long galleries lined with side chambers for the enormous boxes.",
            "The Serapeum is a network of tunnels where the mummified Apis bulls, sacred to Ptah, were entombed in colossal granite sarcophagi weighing up to 70 tonnes — a feat of precision that still puzzles visitors."
        ),
        HiddenSite(
            "gharyan", "Gharyan Underground Houses", null,
            "Libya", "Nafusa Mountains", "Africa", SiteType.CAVE_DWELLING,
            32.1722, 13.0203,
            "Traditional Berber pit-dwellings",
            "Courtyard pits with rooms carved into the sides",
            Access.RESTRICTED,
            "Berber pit-homes carved below the surface of a mountain town.",
            "Round or square pits sunk into the ground open, via a tunnel, onto courtyards with rooms cut into the walls.",
            "Like Matmata across the border, Gharyan's Berbers dug courtyard homes below ground, sheltered from heat and cold. Some pit-houses have been used for generations and a few now welcome guests."
        ),
        HiddenSite(
            "bhalil", "Bhalil Cave Houses", null,
            "Morocco", "Fès-Meknès", "Africa", SiteType.CAVE_DWELLING,
            33.8500, -4.7500,
            "Inhabited for centuries",
            "Homes fronted by rooms carved into the hillside",
            Access.PUBLIC_TOUR,
            "A hillside town where front rooms are caves dug into the slope.",
            "Behind ordinary painted doors, the main living rooms bore back into the soft rock of the hill.",
            "In Bhalil, many houses have a natural cave as their coolest room, dug into the hillside behind the built façade. The little town is known for its troglodyte dwellings and button-making tradition."
        ),
        HiddenSite(
            "bandiagara", "Bandiagara Cliff Dwellings", "Land of the Dogons",
            "Mali", "Bandiagara Escarpment", "Africa", SiteType.CAVE_DWELLING,
            14.3500, -3.3500,
            "Tellem then Dogon, over ~1,000 years",
            "Dwellings and granaries set into a 150 km cliff",
            Access.RESTRICTED,
            "Homes and tombs built into the face of a vast sandstone escarpment.",
            "Mud dwellings and granaries are tucked into cliff ledges and caves, some reached only by ropes or hidden paths.",
            "Along the Bandiagara escarpment, the earlier Tellem and then the Dogon built homes, shrines and burial caves into the cliff face. High, near-inaccessible caves still hold ancient remains and textiles."
        ),
        HiddenSite(
            "lalibela", "Rock-Hewn Churches of Lalibela", null,
            "Ethiopia", "Amhara Region", "Africa", SiteType.ROCK_CITY,
            12.0317, 39.0417,
            "Carved ~12th–13th centuries",
            "11 monolithic churches linked by tunnels and trenches",
            Access.PUBLIC_TOUR,
            "Eleven churches carved down into the rock, linked by hidden tunnels.",
            "The churches sit sunk below ground level in quarried pits, joined by a maze of trenches and dark tunnels.",
            "King Lalibela had eleven churches hewn downward from solid volcanic rock to create a \"New Jerusalem\", including the cross-shaped Bete Giyorgis. Pilgrims still pass between them through subterranean passages."
        ),
        HiddenSite(
            "sterkfontein", "Sterkfontein Caves", "Cradle of Humankind",
            "South Africa", "Gauteng", "Africa", SiteType.CAVE_SYSTEM,
            -26.0167, 27.7333,
            "Fossil-bearing caves, millions of years old",
            "Deep dolomite chambers with an underground lake",
            Access.PUBLIC_TOUR,
            "Caves that yielded some of the richest early-human fossil finds on Earth.",
            "A surface entrance leads down through chambers to a still underground lake far below.",
            "Sterkfontein's limestone caves preserved hominin fossils including \"Mrs Ples\" and \"Little Foot\", central to understanding human origins. The tour descends past excavation sites to a deep subterranean lake."
        )
    )

    // ------------------------------------------------------- NORTH AMERICA ---

    private val northAmerica = listOf(
        HiddenSite(
            "mesa_verde", "Mesa Verde Cliff Dwellings", "Cliff Palace",
            "United States", "Colorado", "North America", SiteType.CAVE_DWELLING,
            37.1830, -108.4870,
            "Ancestral Puebloan, ~1190–1300 AD",
            "~150-room villages tucked into cliff alcoves",
            Access.GUIDED_ONLY,
            "Stone villages hidden in canyon alcoves, reached by ladders and toeholds.",
            "The dwellings sit in recessed alcoves invisible from the mesa top; the Puebloans climbed in by hand-and-toe holds.",
            "In Mesa Verde's alcoves, the Ancestral Puebloans built multi-storey stone villages such as Cliff Palace, with round kivas sunk into the floor. Sheltered and defensible, they were mysteriously abandoned around 1300 AD."
        ),
        HiddenSite(
            "bandelier", "Bandelier Cavates", null,
            "United States", "New Mexico", "North America", SiteType.CAVE_DWELLING,
            35.7783, -106.2706,
            "Ancestral Puebloan, ~1150–1550 AD",
            "Rooms and cavates carved into soft tuff cliffs",
            Access.PUBLIC_TOUR,
            "Cliff homes carved into volcanic tuff along a canyon.",
            "Ladders climb from the canyon floor to small carved cavates hollowed into the soft cliff face.",
            "At Bandelier, Ancestral Puebloans carved \"cavates\" into the soft volcanic tuff of Frijoles Canyon and built masonry rooms against the cliff, living here for centuries before moving to the Rio Grande pueblos."
        ),
        HiddenSite(
            "gila", "Gila Cliff Dwellings", null,
            "United States", "New Mexico", "North America", SiteType.CAVE_DWELLING,
            33.2275, -108.2717,
            "Mogollon people, ~1275–1300 AD",
            "Around 40 rooms inside natural cliff caves",
            Access.PUBLIC_TOUR,
            "Stone rooms built inside natural caves high in a canyon wall.",
            "A trail climbs to a cluster of caves whose mouths hide masonry dwellings tucked within.",
            "The Mogollon built homes inside five natural caves above the Gila River, occupying them for perhaps a single generation. The remarkably intact rooms sit sheltered within the cliff caves."
        ),
        HiddenSite(
            "montezuma_castle", "Montezuma Castle", null,
            "United States", "Arizona", "North America", SiteType.CAVE_DWELLING,
            34.6117, -111.8350,
            "Sinagua people, ~1100–1425 AD",
            "A five-storey cliff dwelling of ~20 rooms",
            Access.PUBLIC_TOUR,
            "A five-storey \"apartment\" built into a limestone cliff recess.",
            "Set high in a cliff alcove above a creek, it was reached by ladders that could be pulled up for defence.",
            "Misnamed for an Aztec emperor who never came here, Montezuma Castle is a well-preserved Sinagua cliff dwelling built into a limestone recess above Beaver Creek, safe from floods and raiders alike."
        ),
        HiddenSite(
            "seattle_underground", "Seattle Underground", null,
            "United States", "Seattle, Washington", "North America", SiteType.TUNNEL_NETWORK,
            47.6010, -122.3340,
            "Created after the 1889 fire",
            "Buried storefronts and sidewalks beneath Pioneer Square",
            Access.GUIDED_ONLY,
            "The original ground-level city, buried when Seattle rebuilt one storey up.",
            "Stairs from Pioneer Square drop to the old sidewalks and shopfronts left below when the streets were raised.",
            "After the Great Fire, Seattle rebuilt its streets a storey higher to fix flooding, leaving the old ground floors and sidewalks entombed below. Tours wander the abandoned storefronts of this buried city."
        ),
        HiddenSite(
            "shanghai_tunnels", "Portland Shanghai Tunnels", "Old Portland Underground",
            "United States", "Portland, Oregon", "North America", SiteType.TUNNEL_NETWORK,
            45.5230, -122.6730,
            "Late 19th to early 20th century",
            "Basements and passages linking Old Town to the waterfront",
            Access.GUIDED_ONLY,
            "Waterfront basement passages wrapped in dark tales of \"shanghaiing\".",
            "Trapdoors in saloon floors and connecting basements gave hidden access between buildings toward the river.",
            "Beneath Old Town, connected basements once linked bars and hotels to the waterfront. Legend says men were drugged, dropped through trapdoors and sold to ship crews; historians debate the tales, but the passages are real."
        ),
        HiddenSite(
            "forestiere", "Forestiere Underground Gardens", null,
            "United States", "Fresno, California", "North America", SiteType.TUNNEL_NETWORK,
            36.8330, -119.8300,
            "Dug 1906–1946 by one man",
            "Rooms, courtyards and planting wells over ~10 acres",
            Access.GUIDED_ONLY,
            "A hand-dug subterranean home and garden with sunlit citrus trees below ground.",
            "A modest surface opening leads down into courtyards where skylights let trees grow underground.",
            "Sicilian immigrant Baldassare Forestiere spent forty years carving a cool underground home, chapel and garden beneath the hard-baked Fresno soil, planting citrus in sunlit wells that fruit below the surface."
        ),
        HiddenSite(
            "subtropolis", "SubTropolis", null,
            "United States", "Kansas City, Missouri", "North America", SiteType.MINE,
            39.1500, -94.5000,
            "Former limestone mine, developed from the 1960s",
            "Around 55 million sq ft of usable space, ~30 m down",
            Access.RESTRICTED,
            "The world's largest underground business complex, in an old mine.",
            "Trucks and trains drive straight in through mine portals in the bluffs into lit industrial \"streets\".",
            "Carved by decades of limestone mining, SubTropolis is now a giant underground business park where companies store film archives and goods in stable, cool conditions, served by roads and rail beneath Kansas City."
        ),
        HiddenSite(
            "mammoth_cave", "Mammoth Cave", null,
            "United States", "Kentucky", "North America", SiteType.CAVE_SYSTEM,
            37.1870, -86.1000,
            "Explored for thousands of years",
            "The world's longest cave, over 685 km mapped",
            Access.PUBLIC_TOUR,
            "The longest known cave system on Earth, with over 685 km of passages.",
            "Historic and natural entrances lead into a five-level labyrinth that early guides and even TB patients once inhabited.",
            "Mammoth Cave is by far the world's longest cave, its interlaced passages still being extended by explorers. Native Americans mined it for minerals millennia ago, and 19th-century guides made it a wonder of the world."
        ),
        HiddenSite(
            "carlsbad", "Carlsbad Caverns", null,
            "United States", "New Mexico", "North America", SiteType.CAVE_SYSTEM,
            32.1479, -104.5567,
            "Formed by sulphuric acid over millions of years",
            "The Big Room is one of the largest cave chambers in North America",
            Access.PUBLIC_TOUR,
            "A stupendous decorated chamber reached by a plunging natural entrance.",
            "A steep switchback trail descends through the yawning natural cave mouth into the depths.",
            "Carlsbad's caverns were dissolved by acidic waters, leaving immense decorated halls including the vast Big Room. Each evening in season, hundreds of thousands of bats spiral out of the natural entrance."
        ),
        HiddenSite(
            "cheyenne_mountain", "Cheyenne Mountain Complex", null,
            "United States", "Colorado", "North America", SiteType.BUNKER,
            38.7439, -104.8458,
            "Built 1961–1966",
            "Buildings on springs inside a granite mountain, ~600 m down",
            Access.RESTRICTED,
            "A command bunker built inside a mountain to survive a nuclear strike.",
            "A long tunnel bored into the granite ends at giant blast doors sealing the buried complex.",
            "Cheyenne Mountain houses hardened command centres built on massive springs inside solid granite, designed to keep operating through a nuclear attack. It became an icon of Cold War continental defence."
        ),
        HiddenSite(
            "greenbrier", "The Greenbrier Bunker", "Project Greek Island",
            "United States", "West Virginia", "North America", SiteType.BUNKER,
            37.7876, -80.3040,
            "Built secretly 1959–1962",
            "A congressional bunker hidden beneath a luxury resort",
            Access.PUBLIC_TOUR,
            "A secret bunker to shelter the U.S. Congress, hidden under a resort.",
            "Blast doors disguised within the Greenbrier hotel led to dormitories and chambers for the legislature.",
            "For thirty years a secret bunker lay beneath the Greenbrier resort, ready to house the entire U.S. Congress after a nuclear war, complete with chambers, dormitories and a clinic. Exposed by a newspaper in 1992, it is now toured."
        ),
        HiddenSite(
            "moose_jaw", "Tunnels of Moose Jaw", null,
            "Canada", "Saskatchewan", "North America", SiteType.TUNNEL_NETWORK,
            50.3930, -105.5510,
            "Early 20th century",
            "Passages beneath the downtown streets",
            Access.PUBLIC_TOUR,
            "Prohibition-era tunnels steeped in bootlegging and immigrant lore.",
            "Hidden hatches and building basements linked businesses out of sight below the street.",
            "Beneath Moose Jaw run tunnels tied to stories of Chinese railway workers hiding below ground and to Prohibition-era bootlegging said to reach Al Capone. The passages now host costumed underground tours."
        ),
        HiddenSite(
            "reso", "RÉSO", "Montreal Underground City",
            "Canada", "Montreal, Quebec", "North America", SiteType.TUNNEL_NETWORK,
            45.5017, -73.5673,
            "Developed from 1962 onward",
            "Around 33 km of tunnels linking much of downtown",
            Access.PUBLIC_TOUR,
            "The world's largest underground city, a climate-controlled network below downtown.",
            "Hundreds of entrances from metro stations, malls and towers lead into the interconnected subterranean concourses.",
            "RÉSO links malls, offices, universities, stations and homes through some 33 km of tunnels, letting people cross downtown Montreal in comfort through the harsh winter — the largest underground complex of its kind."
        ),
        HiddenSite(
            "diefenbunker", "Diefenbunker", "Canada's Cold War Museum",
            "Canada", "Carp, Ontario", "North America", SiteType.BUNKER,
            45.3517, -76.0453,
            "Built 1959–1961",
            "A four-storey bunker buried beneath a field",
            Access.PUBLIC_TOUR,
            "A four-storey government bunker hidden under a farm field near Ottawa.",
            "A long blast tunnel from an innocuous entrance leads down into the buried four-storey complex.",
            "Nicknamed for Prime Minister Diefenbaker, this bunker was built to shelter key government and military staff after a nuclear attack, with a Bank of Canada vault and CBC studio. It now serves as Canada's Cold War Museum."
        ),
        HiddenSite(
            "guanajuato", "Tunnels of Guanajuato", "Túneles de Guanajuato",
            "Mexico", "Guanajuato", "North America", SiteType.TUNNEL_NETWORK,
            21.0190, -101.2570,
            "Flood tunnels adapted for traffic from the 20th c.",
            "Kilometres of stone road-tunnels beneath the city",
            Access.PUBLIC_TOUR,
            "A city whose roads run through a maze of old river tunnels.",
            "Street ramps dive from daylight straight into stone-lined tunnels beneath the plazas.",
            "Guanajuato sits in a ravine that once flooded, so engineers channelled the river through masonry tunnels. As the flood threat eased, the dry tunnels became an underground road network of streets and junctions in the rock."
        ),
        HiddenSite(
            "naica", "Cave of the Crystals", "Cueva de los Cristales",
            "Mexico", "Naica, Chihuahua", "North America", SiteType.CAVE_SYSTEM,
            27.8510, -105.4960,
            "Crystals grown over hundreds of thousands of years",
            "A chamber ~300 m down holding gigantic gypsum crystals",
            Access.RESTRICTED,
            "A superheated chamber of the largest natural crystals ever found.",
            "The cave was exposed only when miners pumped water from a shaft, opening a searing crystal-filled void far below.",
            "Beneath the Naica mine, mineral-rich hot water grew selenite crystals up to 12 m long. The chamber is so hot and humid that humans can endure only minutes; when mining stops and pumps cease, the water reclaims it."
        ),
        HiddenSite(
            "teotihuacan_tunnel", "Teotihuacan Tunnel", null,
            "Mexico", "State of Mexico", "North America", SiteType.TUNNEL_NETWORK,
            19.6925, -98.8339,
            "Sealed ~1,800 years ago",
            "A tunnel ~100 m long beneath a pyramid",
            Access.RESTRICTED,
            "A sealed ritual tunnel found beneath the Temple of the Feathered Serpent.",
            "The entrance was a hidden shaft, deliberately sealed in antiquity and rediscovered in 2003 after a sinkhole appeared.",
            "Under the Temple of the Feathered Serpent, archaeologists found a sealed tunnel ending in chambers strewn with offerings, its walls once glittering with mineral dust to mimic an underworld sky — perhaps a symbolic passage to the netherworld."
        ),
        HiddenSite(
            "balankanche", "Balankanché Cave", null,
            "Mexico", "Yucatán", "North America", SiteType.CAVE_SYSTEM,
            20.6800, -88.5100,
            "Maya ritual use, sealed for centuries",
            "A cave shrine centred on a great stone \"ceiba\" column",
            Access.PUBLIC_TOUR,
            "A Maya ritual cave hiding untouched offerings around a stone tree-of-life.",
            "The sacred inner chamber lay sealed until 1959, preserving offerings exactly as the Maya left them.",
            "Near Chichén Itzá, Balankanché is a cave the Maya used to reach the underworld and honour the rain god. Its sealed galleries held incense burners and pots around a natural column resembling the sacred ceiba tree."
        ),
        HiddenSite(
            "atm_cave", "Actun Tunichil Muknal", "ATM Cave",
            "Belize", "Cayo District", "North America", SiteType.CAVE_SYSTEM,
            17.0800, -88.8900,
            "Maya ritual use, ~700–900 AD",
            "A river cave with skeletal remains and offerings",
            Access.GUIDED_ONLY,
            "A river cave the Maya used as a gateway to Xibalba, holding sacrifices.",
            "Reaching it means swimming into a jungle cave mouth, then wading and climbing deep into the dark.",
            "Actun Tunichil Muknal was a sacred cave where the Maya made offerings and human sacrifices to the underworld gods of Xibalba. Its inner chamber holds pottery and skeletons, including the calcite-glazed \"Crystal Maiden\"."
        )
    )

    // ------------------------------------------------------- SOUTH AMERICA ---

    private val southAmerica = listOf(
        HiddenSite(
            "chavin", "Chavín de Huántar Galleries", null,
            "Peru", "Ancash", "South America", SiteType.TUNNEL_NETWORK,
            -9.5936, -77.1778,
            "Chavín culture, ~1200–500 BC",
            "A maze of stone galleries inside temple platforms",
            Access.PUBLIC_TOUR,
            "Labyrinthine temple tunnels built for dramatic underground ritual.",
            "Narrow stone-lined passages burrow into the temple mounds, lit only where the priests wished.",
            "Beneath the temples of Chavín run interlocking galleries where the Lanzón idol still stands and where acoustics, water channels and darkness were engineered to overwhelm pilgrims in ritual — a designed underworld experience."
        ),
        HiddenSite(
            "cusco_chincana", "Sacsayhuamán Chincana", null,
            "Peru", "Cusco", "South America", SiteType.TUNNEL_NETWORK,
            -13.5089, -71.9817,
            "Inca, 15th century",
            "Rock-cut tunnels and caves within the megalithic fortress",
            Access.PUBLIC_TOUR,
            "Rock-cut caves and tunnels within the great Inca fortress above Cusco.",
            "Openings among the giant stones lead into the Chincana caves; legends tell of longer tunnels reaching the city below.",
            "The megalithic complex above Cusco includes carved caves and tunnels known as chincanas. Colonial legends claim hidden passages once ran all the way to the Coricancha temple in the heart of Cusco."
        ),
        HiddenSite(
            "potosi", "Cerro Rico Mines", "Potosí",
            "Bolivia", "Potosí", "South America", SiteType.MINE,
            -19.6197, -65.7539,
            "Mined since 1545",
            "Thousands of shafts and tunnels riddling a mountain",
            Access.GUIDED_ONLY,
            "A mountain so mined for silver it is honeycombed and slowly collapsing.",
            "Miners enter through countless rough adits in the mountainside into cramped, hot working tunnels.",
            "Cerro Rico's silver funded an empire at a terrible human cost. The mountain is riddled with thousands of tunnels still worked by cooperatives today, where miners leave offerings to \"El Tío\", the spirit of the underground."
        ),
        HiddenSite(
            "zipaquira", "Salt Cathedral of Zipaquirá", "Catedral de Sal",
            "Colombia", "Cundinamarca", "South America", SiteType.MINE,
            5.0186, -74.0142,
            "Cathedral built from 1950s in an older salt mine",
            "A church carved ~180 m inside a salt mountain",
            Access.PUBLIC_TOUR,
            "A vast cathedral carved from rock salt deep inside a mine.",
            "A tunnel leads from the mountainside down past illuminated stations of the cross to the great salt nave.",
            "Within a working salt mine, miners and artists carved an entire underground cathedral from halite, with soaring naves, a giant cross and glowing chambers — one of Colombia's most striking sights, deep in the mountain."
        ),
        HiddenSite(
            "tayos", "Cueva de los Tayos", null,
            "Ecuador", "Morona-Santiago", "South America", SiteType.CAVE_SYSTEM,
            -3.0000, -78.2000,
            "Natural cave, long known to the Shuar",
            "Deep vertical shafts opening into large chambers",
            Access.GUIDED_ONLY,
            "A deep jungle cave wrapped in a legend of a hidden metal library.",
            "Entry is a plunge down a vertical shaft into vast chambers home to nocturnal oilbirds (tayos).",
            "Sacred to the Shuar, this cave became famous when a 1970s book claimed it held a metal library of ancient wisdom, prompting an expedition including astronaut Neil Armstrong. No library was found, but the huge, mysterious caverns endure."
        ),
        HiddenSite(
            "manzana_luces", "Tunnels of Manzana de las Luces", null,
            "Argentina", "Buenos Aires", "South America", SiteType.TUNNEL_NETWORK,
            -34.6114, -58.3750,
            "Dug in the 18th century",
            "Brick tunnels beneath the historic block",
            Access.GUIDED_ONLY,
            "Colonial tunnels beneath Buenos Aires linked to Jesuits and smuggling.",
            "The passages open from cellars beneath the old Jesuit block and once reached other churches and the river.",
            "Under the \"Block of Enlightenment\" run 18th-century tunnels attributed to the Jesuits, thought to have served for defence, communication and contraband. Only fragments of the once-wider network survive."
        ),
        HiddenSite(
            "boa_vista", "Toca da Boa Vista", null,
            "Brazil", "Bahia", "South America", SiteType.CAVE_SYSTEM,
            -10.9833, -40.8667,
            "Ancient limestone cave system",
            "The longest cave in South America, over 100 km mapped",
            Access.RESTRICTED,
            "South America's longest cave, a vast dry maze rich in fossils.",
            "Remote openings in the dry sertão lead into a huge dry labyrinth explored only by cavers and scientists.",
            "Toca da Boa Vista is the longest cave in the southern hemisphere by some measures, a bone-dry maze in Bahia's backlands that has yielded fossils of extinct giant ground sloths and other Ice Age megafauna."
        )
    )

    // ------------------------------------------------------------ OCEANIA ---

    private val oceania = listOf(
        HiddenSite(
            "coober_pedy", "Coober Pedy Dugouts", "kupa-piti",
            "Australia", "South Australia", "Oceania", SiteType.CAVE_DWELLING,
            -29.0139, 134.7544,
            "Opal-mining town, dug in from around 1915",
            "Homes, churches and hotels cut into the hillsides",
            Access.PUBLIC_TOUR,
            "An opal town that moved underground to escape furnace-hot desert heat.",
            "Ordinary-looking doors and stovepipe vents in the hillsides are the only sign of the homes tunnelled behind them.",
            "In the searing desert, Coober Pedy dug its life underground, where the temperature stays mild. \"Dugouts\" include homes, bars, bookshops and churches, and residents sometimes strike opal while extending a room."
        ),
        HiddenSite(
            "white_cliffs", "White Cliffs Dugouts", null,
            "Australia", "New South Wales", "Oceania", SiteType.CAVE_DWELLING,
            -30.8514, 143.0847,
            "Opal town, from the 1890s",
            "Underground homes dug into low desert hills",
            Access.PUBLIC_TOUR,
            "A tiny opal settlement living underground against the outback heat.",
            "Doorways set into the pale hills lead to cool dugout homes and an underground guesthouse.",
            "One of Australia's oldest opal fields, White Cliffs saw residents move into dugouts to escape extreme heat. The scattered underground homes, and a solar station above, make it a remarkable outback survivor."
        ),
        HiddenSite(
            "jenolan", "Jenolan Caves", null,
            "Australia", "New South Wales", "Oceania", SiteType.CAVE_SYSTEM,
            -33.8206, 150.0217,
            "Among the world's oldest known open caves",
            "Around 40 km of surveyed limestone passages",
            Access.PUBLIC_TOUR,
            "Ancient, richly decorated limestone caves in the Blue Mountains.",
            "A road actually passes through the Grand Arch, a giant natural cave mouth, into the show-cave system.",
            "The Jenolan Caves are among the oldest discovered cave systems on Earth, with dramatically decorated chambers and underground rivers. A network of show caves winds beneath the Blue Mountains."
        ),
        HiddenSite(
            "waitomo", "Waitomo Glowworm Caves", null,
            "New Zealand", "Waikato", "Oceania", SiteType.CAVE_SYSTEM,
            -38.2611, 175.1017,
            "Limestone caves, first explored in 1887",
            "Chambers and an underground river lit by glowworms",
            Access.PUBLIC_TOUR,
            "Limestone caves whose ceilings glitter with thousands of glowworms.",
            "A boat glides silently along an underground river beneath a living galaxy of blue-green lights.",
            "In the Waitomo caves, the larvae of a native fungus gnat cover the ceilings with luminous threads, turning the dark into a starry sky. Local Māori knew the caves long before their 1887 survey."
        )
    )

    // ------------------------------------------------ LEGENDS & MYTHIC ------

    private val legends = listOf(
        HiddenSite(
            "agartha", "Agartha", "Shambhala",
            "Legend", "Said to lie deep within the Earth", "Mythic", SiteType.MYTH_GATEWAY,
            30.0000, 90.0000,
            "Myth of a subterranean realm",
            "A hidden kingdom rumoured beneath the Himalayas and the poles",
            Access.LEGENDARY,
            "A legendary advanced civilisation said to dwell inside a hollow Earth.",
            "Its entrances are placed by legend in the Himalayas, at the poles, and in remote caves — none ever verified.",
            "Agartha is a mythical subterranean kingdom, often merged with Shambhala, believed by esoteric traditions to hold an enlightened civilisation at the Earth's core. It belongs to folklore and the \"hollow Earth\" idea, not to geography."
        ),
        HiddenSite(
            "hades_realm", "Hades", "The Greek Underworld",
            "Legend", "Ancient Greek cosmology", "Mythic", SiteType.MYTH_GATEWAY,
            37.9271, 22.9310,
            "Greek mythology",
            "The realm of the dead beyond the rivers Styx and Acheron",
            Access.LEGENDARY,
            "The Greek realm of the dead, reached across the river Styx.",
            "Myth placed its entrances at real caves and lakes — Cape Tainaron, Lake Avernus and the Acheron among them.",
            "In Greek myth the dead crossed the Styx, ferried by Charon, into the shadowy kingdom of Hades. Several real caves and volcanic lakes were revered as physical gateways to it, blending geography with the afterlife."
        ),
        HiddenSite(
            "xibalba", "Xibalba", "Place of Fear",
            "Legend", "Maya cosmology", "Mythic", SiteType.MYTH_GATEWAY,
            16.5000, -89.5000,
            "Maya mythology",
            "The underworld of the Maya, entered through caves and cenotes",
            Access.LEGENDARY,
            "The Maya underworld of dread, reached through caves and sinkholes.",
            "The Maya treated real caves and cenotes as mouths of Xibalba, leaving offerings and sacrifices at their thresholds.",
            "Xibalba, the \"place of fear\", was the underworld ruled by death gods in the Popol Vuh. The Maya entered its physical gateways — caves like Actun Tunichil Muknal and deep cenotes — to make offerings to the powers below."
        ),
        HiddenSite(
            "sheol", "Sheol", null,
            "Legend", "Hebrew scripture and Kabbalah", "Mythic", SiteType.MYTH_GATEWAY,
            31.7784, 35.2066,
            "Ancient Hebrew cosmology",
            "The shadowy abode of the dead beneath the earth",
            Access.LEGENDARY,
            "The biblical realm of the dead, imagined deep beneath the earth.",
            "Scripture and Kabbalistic works such as the Zohar describe descents into the earth's hidden lower levels, without a mapped door.",
            "Sheol is the Hebrew Bible's underworld, a still, dim place to which all the dead descend. Later Kabbalistic literature elaborated an inner structure of the earth, keeping Sheol firmly in the realm of the sacred and symbolic."
        ),
        HiddenSite(
            "svartalfheim", "Svartálfaheim", "Niðavellir",
            "Legend", "Norse cosmology", "Mythic", SiteType.MYTH_GATEWAY,
            64.9631, -19.0208,
            "Norse mythology",
            "The subterranean world of the dwarves",
            Access.LEGENDARY,
            "The Norse underground realm of dwarven smiths and dark elves.",
            "Reached, in the sagas, only through the deep places of the earth — caves, mines and the roots of the world-tree.",
            "In Norse myth, Svartálfaheim (or Niðavellir) is the subterranean home of the dwarves, master smiths who forged the gods' greatest treasures. It lies among the nine worlds beneath the surface, below the roots of Yggdrasil."
        ),
        HiddenSite(
            "diyu", "Diyu", "Chinese Underworld",
            "Legend", "Chinese folk religion", "Mythic", SiteType.MYTH_GATEWAY,
            29.8620, 107.7100,
            "Chinese mythology",
            "A maze of courts and chambers judging the dead",
            Access.LEGENDARY,
            "The Chinese underworld of courts and hells that judge the dead.",
            "The town of Fengdu on the Yangtze became its earthly \"Ghost City\", a symbolic gateway to Diyu's tribunals.",
            "Diyu is the underworld of Chinese folk belief, a bureaucratic maze of chambers where souls are judged and purified. The riverside \"Ghost City\" of Fengdu has long stood as its symbolic gateway on Earth."
        ),
        HiddenSite(
            "naraka", "Naraka", "Patala's hells",
            "Legend", "Hindu and Buddhist cosmology", "Mythic", SiteType.MYTH_GATEWAY,
            27.0000, 78.0000,
            "Indian mythology",
            "Subterranean worlds and hells below the earth",
            Access.LEGENDARY,
            "The subterranean worlds and hells of Indian cosmology.",
            "Texts describe Patala, the many-layered nether realms, reached through the depths rather than any single cave.",
            "In Hindu and Buddhist thought, below the earth lie Patala — richly described nether worlds — and Naraka, realms of purgation. They form a vast vertical cosmology of the underground, mythic rather than mapped."
        ),
        HiddenSite(
            "hollow_earth", "Hollow Earth", "Agartha's polar door",
            "Legend", "Modern folklore and pseudoscience", "Mythic", SiteType.MYTH_GATEWAY,
            90.0000, 0.0000,
            "18th-century onward speculation",
            "An imagined inner world reached through polar openings",
            Access.LEGENDARY,
            "The debunked idea that the Earth is hollow with polar entrances.",
            "Believers claim vast openings at the North and South Poles lead to an inner world — no such openings exist.",
            "The Hollow Earth is a long-debunked notion that our planet contains a habitable interior, entered through holes at the poles. Though disproven by geophysics, it endures in fiction and conspiracy lore, often tied to Agartha."
        )
    )

    fun byId(id: String): HiddenSite? = all.firstOrNull { it.id == id }

    /** Distinct continents present in the atlas, in a friendly display order. */
    fun continents(): List<String> {
        val order = listOf(
            "Africa", "Asia", "Europe",
            "North America", "South America", "Oceania", "Mythic"
        )
        val present = all.map { it.continent }.toSet()
        return order.filter { present.contains(it) } + present.filter { !order.contains(it) }.sorted()
    }

    /**
     * Filter + free-text search over the atlas.
     *
     * @param query case-insensitive text matched against the search index
     * @param type restrict to a single [SiteType], or null for all
     * @param continent restrict to a single continent, or null for all
     * @param favoriteIds when [favoritesOnly] is true, only sites in this set are returned
     */
    fun filter(
        query: String = "",
        type: SiteType? = null,
        continent: String? = null,
        favoritesOnly: Boolean = false,
        favoriteIds: Set<String> = emptySet()
    ): List<HiddenSite> {
        val q = query.trim().lowercase()
        return all.filter { site ->
            (type == null || site.type == type) &&
                (continent == null || site.continent == continent) &&
                (!favoritesOnly || favoriteIds.contains(site.id)) &&
                (q.isEmpty() || q.split(" ").all { token -> site.searchIndex.contains(token) })
        }.sortedBy { it.name }
    }
}
