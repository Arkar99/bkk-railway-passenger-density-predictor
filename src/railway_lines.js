const LINES = {
    "BTS_Sukhumvit": {
        color: "Light Green",
        stations: [
            "Khu Khot", "Yaek Kor Por Aor", "Royal Thai Air Force Museum", "Bhumibol Adulyadej Hospital",
            "Saphan Mai", "Sai Yud", "Phahon Yothin 59", "Wat Phra Sri Mahathat", "11th Infantry Regiment",
            "Bang Bua", "Royal Forest Department", "Kasetsart University", "Sena Nikhom", "Ratchayothin",
            "Phahon Yothin 24", "Ha Yaek Lat Phrao", "Mo Chit", "Saphan Khwai", "Ari", "Sanam Pao",
            "Victory Monument", "Phaya Thai", "Ratchathewi", "Siam", "Chit Lom", "Phloen Chit", "Nana",
            "Asok", "Phrom Phong", "Thong Lo", "Ekkamai", "Phra Khanong", "On Nut", "Bang Chak",
            "Punnawithi", "Udom Suk", "Bang Na", "Bearing", "Samrong", "Pu Chao", "Chang Erawan",
            "Royal Thai Naval Academy", "Pak Nam", "Srinagarindra", "Phraek Sa", "Sai Luat", "Kheha"
        ]
    },
    "BTS_Silom": {
        color: "Dark Green",
        stations: [
            "National Stadium", "Siam", "Ratchadamri", "Sala Daeng", "Chong Nonsi", "Saint Louis",
            "Surasak", "Saphan Taksin", "Krung Thon Buri", "Wongwian Yai", "Pho Nimit", "Talat Phlu",
            "Wutthakat", "Bang Wa"
        ]
    },
    "BTS_Gold": {
        color: "Gold",
        stations: ["Krung Thon Buri", "Charoen Nakhon", "Khlong San"]
    },
    "MRT_Blue": {
        color: "Blue",
        stations: [
            "Tha Phra", "Charan 13", "Fai Chai", "Bang Khun Non", "Bang Yi Khan", "Sirindhorn",
            "Bang Phlat", "Bang O", "Bang Pho", "Tao Poon", "Bang Sue", "Kamphaeng Phet",
            "Chatuchak Park", "Phahon Yothin", "Lat Phrao", "Ratchadaphisek", "Sutthisan",
            "Huai Khwang", "Thailand Cultural Centre", "Phra Ram 9", "Phetchaburi", "Sukhumvit",
            "Queen Sirikit National Convention Centre", "Khlong Toei", "Lumphini", "Si Lom",
            "Sam Yan", "Hua Lamphong", "Wat Mangkon", "Sam Yot", "Sanam Chai", "Itsaraphap",
            "Tha Phra", "Bang Phai", "Bang Wa", "Phetkasem 48", "Phasi Charoen", "Bang Khae", "Lak Song"
        ]
    },
    "MRT_Purple": {
        color: "Purple",
        stations: [
            "Khlong Bang Phai", "Talad Bang Yai", "Sam Yaek Bang Yai", "Bang Phlu", "Bang Rak Yai",
            "Bang Rak Noi Tha It", "Sai Ma", "Phra Nang Klao Bridge", "Yaek Nonthaburi 1",
            "Bang Krasor", "Nonthaburi Civic Center", "Ministry of Public Health", "Yaek Tiwanon",
            "Wong Sawang", "Bang Son", "Tao Poon"
        ]
    },
    "MRT_Yellow": {
        color: "Yellow",
        stations: [
            "Lat Phrao", "Phawana", "Chok Chai 4", "Lat Phrao 71", "Lat Phrao 83", "Mahat Thai",
            "Lat Phrao 101", "Bang Kapi", "Yaek Lam Sali", "Si Kritha", "Hua Mak", "Kalantan",
            "Si Nut", "Srinagarindra 38", "Suan Luang Rama IX", "Si Udom", "Si Iam", "Si La Salle",
            "Si Bearing", "Si Dan", "Si Thepha", "Thipphawan", "Samrong"
        ]
    },
    "MRT_Pink": {
        color: "Pink",
        stations: [
            "Nonthaburi Civic Center", "Khae Rai", "Sanambin Nam", "Samakkhi", "Royal Irrigation Department",
            "Yaek Pak Kret", "Pak Kret Bypass", "Chaeng Watthana - Pak Kret 28", "Si Rat", "Muang Thong Thani",
            "Chaeng Watthana 14", "Government Complex", "National Telecom", "Lak Si", "Rajabhat Phranakhon",
            "Wat Phra Sri Mahathat", "Ram Inthra 3", "Lat Pla Khao", "Ram Inthra Kor Mor 4", "Maiyalap",
            "Vacharaphol", "Ram Inthra Kor Mor 6", "Khu Bon", "Ram Inthra Kor Mor 9",
            "Outer Ring Road - Ram Inthra", "Nopparat", "Bang Chan", "Setthabutbamphen",
            "Min Buri Market", "Min Buri"
        ]
    },
    "ARL": {
        color: "Red",
        stations: [
            "Suvarnabhumi (Airport)", "Lat Krabang", "Ban Thap Chang", "Hua Mak", "Ramkhamhaeng",
            "Makkasan", "Ratchaprarop", "Phaya Thai"
        ]
    },
    "SRT_Red_Dark": {
        color: "Dark Red",
        stations: [
            "Krung Thep Aphiwat", "Chatuchak", "Wat Samian Nari", "Bang Khen", "Thung Song Hong",
            "Lak Si", "Kan Kheha", "Don Mueang", "Lak Hok", "Rangsit"
        ]
    },
    "SRT_Red_Light": {
        color: "Light Red",
        stations: [
            "Krung Thep Aphiwat", "Bang Son", "Bang Bumru", "Taling Chan"
        ]
    }
};

// Interchanges: key station name -> array of [line_name, actual_station_name_on_that_line]
// Use for transfers. Station names may differ slightly between lines.
const INTERCHANGES = {
    "Siam": [["BTS_Sukhumvit", "Siam"], ["BTS_Silom", "Siam"]],
    "Wat Phra Sri Mahathat": [["BTS_Sukhumvit", "Wat Phra Sri Mahathat"], ["MRT_Pink", "Wat Phra Sri Mahathat"]],
    "Ha Yaek Lat Phrao": [["BTS_Sukhumvit", "Ha Yaek Lat Phrao"], ["MRT_Blue", "Phahon Yothin"]],
    "Mo Chit": [["BTS_Sukhumvit", "Mo Chit"], ["MRT_Blue", "Chatuchak Park"]],
    "Phaya Thai": [["BTS_Sukhumvit", "Phaya Thai"], ["ARL", "Phaya Thai"]],
    "Asok": [["BTS_Sukhumvit", "Asok"], ["MRT_Blue", "Sukhumvit"]],
    "Samrong": [["BTS_Sukhumvit", "Samrong"], ["MRT_Yellow", "Samrong"]],
    "Sala Daeng": [["BTS_Silom", "Sala Daeng"], ["MRT_Blue", "Si Lom"]],
    "Krung Thon Buri": [["BTS_Silom", "Krung Thon Buri"], ["BTS_Gold", "Krung Thon Buri"]],
    "Bang Wa": [["BTS_Silom", "Bang Wa"], ["MRT_Blue", "Bang Wa"]],
    "Tao Poon": [["MRT_Blue", "Tao Poon"], ["MRT_Purple", "Tao Poon"]],
    "Bang Sue": [["MRT_Blue", "Bang Sue"], ["SRT_Red_Dark", "Krung Thep Aphiwat"], ["SRT_Red_Light", "Krung Thep Aphiwat"]],
    "Lat Phrao": [["MRT_Blue", "Lat Phrao"], ["MRT_Yellow", "Lat Phrao"]],
    "Phetchaburi": [["MRT_Blue", "Phetchaburi"], ["ARL", "Makkasan"]],
    "Nonthaburi Civic Center": [["MRT_Purple", "Nonthaburi Civic Center"], ["MRT_Pink", "Nonthaburi Civic Center"]],
    "Bang Son": [["MRT_Purple", "Bang Son"], ["SRT_Red_Light", "Bang Son"]],
    "Hua Mak": [["MRT_Yellow", "Hua Mak"], ["ARL", "Hua Mak"]],
    "Lak Si": [["MRT_Pink", "Lak Si"], ["SRT_Red_Dark", "Lak Si"]],
    "Tha Phra": [["MRT_Blue", "Tha Phra"]]  // loop self-interchange
};

export { LINES, INTERCHANGES };