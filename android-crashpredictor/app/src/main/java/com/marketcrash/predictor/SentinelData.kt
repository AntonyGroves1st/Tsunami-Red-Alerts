package com.marketcrash.predictor

/**
 * Watchlists for the sentinel layer: the world's 50 wealthiest people, major
 * world-leader offices, and the long-haul routes into New Zealand (the famous
 * billionaire "bunker trigger").
 *
 * IMPORTANT: the app derives sentinel *statuses* heuristically from live market
 * stress (see [SentinelEngine]) — it does not, and cannot, track real people,
 * private jets or ticket purchases. The lists are public knowledge; the
 * "activity" shown is an illustrative early-warning metaphor.
 */
object SentinelData {

    /** Approximate top-50 richest people (public Forbes-style list). */
    val billionaires: List<Billionaire> = listOf(
        Billionaire("Elon Musk", "United States", "Tesla, SpaceX"),
        Billionaire("Jeff Bezos", "United States", "Amazon"),
        Billionaire("Mark Zuckerberg", "United States", "Meta"),
        Billionaire("Larry Ellison", "United States", "Oracle"),
        Billionaire("Bernard Arnault", "France", "LVMH luxury"),
        Billionaire("Warren Buffett", "United States", "Berkshire Hathaway"),
        Billionaire("Larry Page", "United States", "Google"),
        Billionaire("Sergey Brin", "United States", "Google"),
        Billionaire("Bill Gates", "United States", "Microsoft"),
        Billionaire("Steve Ballmer", "United States", "Microsoft"),
        Billionaire("Jensen Huang", "United States", "Nvidia"),
        Billionaire("Michael Bloomberg", "United States", "Bloomberg LP"),
        Billionaire("Michael Dell", "United States", "Dell"),
        Billionaire("Mukesh Ambani", "India", "Reliance Industries"),
        Billionaire("Gautam Adani", "India", "Adani Group"),
        Billionaire("Amancio Ortega", "Spain", "Zara / Inditex"),
        Billionaire("Carlos Slim Helú", "Mexico", "Telecom"),
        Billionaire("Francoise Bettencourt Meyers", "France", "L'Oréal"),
        Billionaire("Alice Walton", "United States", "Walmart"),
        Billionaire("Jim Walton", "United States", "Walmart"),
        Billionaire("Rob Walton", "United States", "Walmart"),
        Billionaire("Julia Koch", "United States", "Koch Industries"),
        Billionaire("Charles Koch", "United States", "Koch Industries"),
        Billionaire("Jacqueline Mars", "United States", "Mars candy"),
        Billionaire("John Mars", "United States", "Mars candy"),
        Billionaire("MacKenzie Scott", "United States", "Amazon, philanthropy"),
        Billionaire("Zhong Shanshan", "China", "Nongfu Spring"),
        Billionaire("Zhang Yiming", "China", "ByteDance / TikTok"),
        Billionaire("Ma Huateng", "China", "Tencent"),
        Billionaire("Colin Huang", "China", "PDD / Temu"),
        Billionaire("Jack Ma", "China", "Alibaba"),
        Billionaire("Tadashi Yanai", "Japan", "Uniqlo"),
        Billionaire("Masayoshi Son", "Japan", "SoftBank"),
        Billionaire("Dieter Schwarz", "Germany", "Lidl, Kaufland"),
        Billionaire("Klaus-Michael Kühne", "Germany", "Shipping / logistics"),
        Billionaire("Giovanni Ferrero", "Italy", "Ferrero / Nutella"),
        Billionaire("Rodolphe Saadé", "France", "CMA CGM shipping"),
        Billionaire("Gina Rinehart", "Australia", "Mining"),
        Billionaire("Andrew Forrest", "Australia", "Fortescue mining"),
        Billionaire("Li Ka-shing", "Hong Kong", "CK Hutchison"),
        Billionaire("Lee Shau-kee", "Hong Kong", "Real estate"),
        Billionaire("Abigail Johnson", "United States", "Fidelity"),
        Billionaire("Ken Griffin", "United States", "Citadel"),
        Billionaire("Stephen Schwarzman", "United States", "Blackstone"),
        Billionaire("Ray Dalio", "United States", "Bridgewater"),
        Billionaire("Phil Knight", "United States", "Nike"),
        Billionaire("Miriam Adelson", "United States", "Las Vegas Sands"),
        Billionaire("Savitri Jindal", "India", "Jindal steel"),
        Billionaire("Vladimir Potanin", "Russia", "Norilsk Nickel"),
        Billionaire("Peter Thiel", "United States", "Palantir, venture capital")
    )

    /** Major world-leader offices watched for "early-bird" behaviour. */
    val leaders: List<Leader> = listOf(
        Leader("The President", "President", "United States"),
        Leader("The President", "President", "China"),
        Leader("The President", "President", "Russia"),
        Leader("The Prime Minister", "Prime Minister", "India"),
        Leader("The Prime Minister", "Prime Minister", "United Kingdom"),
        Leader("The President", "President", "France"),
        Leader("The Chancellor", "Chancellor", "Germany"),
        Leader("The Prime Minister", "Prime Minister", "Japan"),
        Leader("The Prime Minister", "Prime Minister", "Italy"),
        Leader("The Prime Minister", "Prime Minister", "Canada"),
        Leader("The President", "President", "Brazil"),
        Leader("The Prime Minister", "Prime Minister", "Australia"),
        Leader("The President", "President", "South Korea"),
        Leader("The President", "President", "Mexico"),
        Leader("The President", "President", "Indonesia"),
        Leader("The President", "President", "Turkey"),
        Leader("The Crown Prince", "Crown Prince", "Saudi Arabia"),
        Leader("The President", "President", "South Africa"),
        Leader("The President", "President", "Argentina"),
        Leader("The Prime Minister", "Prime Minister", "New Zealand"),
        Leader("The Secretary-General", "Secretary-General", "United Nations"),
        Leader("The President", "ECB President", "European Central Bank"),
        Leader("The Chair", "Fed Chair", "US Federal Reserve"),
        Leader("The Governor", "BoE Governor", "Bank of England")
    )

    /** Long-haul corridors into New Zealand watched for a sudden surge. */
    val nzRoutes: List<NzRoute> = listOf(
        NzRoute("Los Angeles", "LAX", "AKL"),
        NzRoute("San Francisco", "SFO", "AKL"),
        NzRoute("New York JFK", "JFK", "AKL"),
        NzRoute("Seattle", "SEA", "CHC"),
        NzRoute("London Heathrow", "LHR", "AKL"),
        NzRoute("Dubai", "DXB", "AKL"),
        NzRoute("Singapore", "SIN", "CHC"),
        NzRoute("Hong Kong", "HKG", "AKL"),
        NzRoute("Vancouver", "YVR", "AKL"),
        NzRoute("São Paulo", "GRU", "AKL"),
        NzRoute("Van Nuys (private)", "VNY", "ZQN"),
        NzRoute("Teterboro (private)", "TEB", "ZQN")
    )
}
