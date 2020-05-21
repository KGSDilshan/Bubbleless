const BANNED_NAMES =
[
"TRUNG-ANHNGUYEN",
"AMYYOUNG",
"DAVIDLEE",
"LUKEJACKSON",
"MICHAELLOPEZ",
"DAVIDWILSON",
"JONATHANMCLAUGHLIN",
"JOHNMCLAUGHLIN",
"JIMMCLAUGHLIN",
"STUARTPOLK",
"KEITHZEIG",
"MARIANNECAMPBELL",
"BRIANLARKIN",
"MARGIEFILS",
"ROBSCHMIDT",
"ROBERTSCHMIDT",
"CURTISBELOW",
"RICHARDBERNARD",
"LAURACOVARRUBIAS",
"LUCIADELPUPPO",
"MIRANDAEVERITT",
"JOHNFAIRBANK",
"JONATHANFAIRBANK",
"SETHGEYER",
"SHERRYLJURISCH",
"VICTORLOUIE",
"LIZMARES-KIM",
"PAULMASLIN",
"RICHARDMAULLIN",
"DAVIDMETZ",
"ESTHERNICHOLS",
"CAPRICEPRIMO",
"ANKUSHRAO",
"RICKSKLARZ",
"RICHARDSKLARZ",
"DAVIDSOKOLOVE",
"ADAMSONENSHEIN",
"AARONSTILLMAN",
"JOHNTRAVALE",
"RENATOVILLACORTE",
"ANDIEMORHOUS",
"ANDREWTHIBAULT",
"BASAKFILIZ",
"BRENDANKARA",
"BRANDONVINES",
"TRAVISBUNNER",
"CHANDLERCORALLO",
"CHELSEASEKTNAN",
"DAVEBEATTIE",
"DAVIDBEATTIE",
"DIONESAY",
"EMILYGOODMAN",
"ERICCAMERON",
"ERICAO'BRIEN",
"ERICAOBRIEN",
"IANSTEWART",
"JAMESBARNETT",
"JAMESMCCLAIN",
"JANERAYBURN",
"JESSICAPOLSKY",
"JILLIANPRUSA",
"JONATHANLEE",
"JORDANDELGUERCIO",
"JOSHUAEMENEGER",
"JULIARUBEN",
"KATHRYNDAVISON",
"KEVINWALL",
"MAGGIERYNER",
"MALLORYTHAYER",
"MAYRACUEVAS",
"MEHANSYMPSON",
"MELISSAASHBAUGH",
"MICHAELRAMIREZ",
"MICHAELMURAWSKI",
"MOLLYO'SHAUGHNESSY",
"MOLLYOSHAUGHNESSY",
"RACHELBEIDLER",
"REBECCAHUGHES",
"RILEYJONES",
"RILEYGALVIN",
"ROBYESWARTZ",
"RUTHBERNSTEIN",
"SARALABATT",
"SHANIMCELROY",
"SIANNAZIEGLER",
"SUSIEMEYER",
"TOMPATRAS",
"THOMASPATRAS",
"TRUNGANHNGUYEN",
"VALENCIAWRIGHT",
"JOHNANZALONE",
"JEFFLISZT",
"JEFFERYLISZT",
"LISAGROVE",
"MATTHOGAN",
"MATTHEWHOGAN",
"ZACMCCRARY",
"ZACHARYMCCRARY",
"MOLLYMURPHY",
"BRIANSTRYKER",
"CASEYFARMER",
"KEVINAKINS",
"PIANARGUNDKAR",
"GEOFFPURYEAR",
"BENLENET",
"BENJAMINLENET",
"HEATHERSTANDIFER",
"SAMANTHAGILBERT",
"SAPORSHARILEY",
"JUSTINANDERSON",
"TORYWATERS",
"DOROTHYMANEVICH",
"ORENSAVIR",
"RAVENSANDERS",
"SAMWILLOUGHBY",
"PAULOSHINSKI",
"GRAHAMWILLARD",
"ANDREASCREWS",
"DIANACANDELARIA",
"DAVIDBINDER",
"WILLIAMGUDELUNAS",
"SEIJICARPENTER",
"SHANANALPER",
"ETHANAXELROD",
"BENMEYERS",
"BENJAMINMEYERS",
"ERINDIXON",
"SPENCERDIXON-WORD",
"SPENCERDIXONWARD",
"CAROLGAILEY",
"SIMONJARRAR",
"JOHNSILLS",
"JONATHANSILLS",
"CELINDALAKE",
"ALYSIASNELL",
"DAVIDMERMIN",
"ROBERTMEADOW",
"DANIELGOTOFF",
"JOSHUAULIBARRI",
"ROBERTHILLMAN",
"ALANROSENBLATT",
"ANDERSONGARDNER",
"JONATHANVOSS",
"CATEGORMLEY",
"DANIELSPICER",
"DANSPICER",
"MERYLO'BRYAN",
"MERYLOBRYAN",
"COREYTETER",
"JESSEKLINE",
"KELSEYBULLIS",
"CHRISTINEFREDERICK",
"SAHILMEHROTRA",
"EMILYCARAMELLI",
"LINDSEYBUTTEL",
"TIMOTHYDIXON",
"BEAUSALANT",
"EMILYGARNER",
"PATRICKRARDIN",
"DEREKBRIZENDINE",
"HENRYCRAWFORD",
"MATTEBERLE",
"MATTHEWEBERLE",
"GRETCHENPFAU",
"SAMMADRIGAL",
"SAMUELMADRIGAL",
"BENTULCHIN",
"BENJAMINTULCHIN",
"BENKROMPAK",
"BENJAMINKROMPAK",
"COREYO'NEIL",
"COREYONEIL",
"KIELBRUNNER",
"ASHMCEVOY",
"ASHLEIGHMCEVOY",
"ASHAGUPTA",
"JENNIFERBUNCH",
"JENNYBUNCH",
"MATTGAMMON",
"DANIELNARVAIZ",
"RYANSTEUSLOFF",
"CHRISPERKINS",
"CHRISTOPHERPERKINS",
"JUSTINDURAN",
"JORDANHAGOOD",
"NATELACOMBE",
"NATHANLACOMBE",
"ADAMRAEZLER",
"WILLIAMDAWSON",
"WILLDAWSON",
"CHELSEAGOODALE",
"ADAMPROBOLSKY",
"DESIREEPROBOLSKY",
"LAURAFLORES",
"VICTORIAGRIFFIN",
"GABRIELLABENITEZ",
"GABBYBENITEZ",
"SHALOMVEFFER",
"ELODIEGOODMAN",
"CHRISKEATING",
"CHRISTOPHERKEATING",
"DEANMITCHELL",
"JUSTINWALLIN",
"STEPHENSPIKER",
"MITCHMCCONNELL",
"MITCHELLMCCONNELL",
"TONYFABRIZIO",
"ANTHONYFABRIZIO",
"TRAVISTUNIS",
"JOHNWARD",
"JONATHANWARD",
"ROBERTBLIZZARD",
"GLENBOLGER",
"ELIZABETHHARRINGTON",
"JIMHOBART",
"PATRICKLANNE",
"JARRETTLEWIS",
"NICOLEMCCLESKEY",
"BILLMCINTURFF",
"WILLIAMMCINTURFF",
"ANSLEYMARKWELL",
"GEORGENASSAR",
"NEILNEWHOUSE",
"MICAHROBERTS",
"GENEULM",
"JAREDBEARD",
"KYLECLARK",
"GABEIMBER",
"GABRIELLAIMBER",
"REBECCAKRAMER",
"BECKYKRAMER",
"DANIELLUONGO",
"KAROLINEMCGRAIL",
"TORIMILLER",
"LINDAMONTFORT",
"GORDONPRICE",
"ANDREWSENESAC",
"RYANSPAUDE",
"NASHSTAMSON",
"JAMIEWADOVICK",
"DAVEWILSON",
"CARLIEBUTLER",
"AMENAJANNAT",
"STEFANHANKIN",
"BENNETTLIPSCOMB",
"ANNEHAZLETT",
"SAMANTHANELSON",
"MAHAMEDOMAR",
"SAMUELWILLOUGHBY",
"ELIZABETHCRENSHAW",
"SOPHIEHALE-BROWN",
"SOPHIEHALEBROWN",
"IGORTSUKER",
"ANHKHOAPHAM",
"CHARLESWATERS",
"ANGELICAVILLAFUERTE",
"JOHNWHITTIER",
"SEANCHAMPAGNE",
"SAMANTAHGILBERT",
"NOLANJACKSON",
"BRIDGETKILMER",
"JOELUMANSOC",
"LUKEMARTIN",
"KELLYMIDDENDORFF",
"KRISTINABRITTON",
"EVANWILSON",
"ERIKIVERSON",
"HANSKAISER",
"BOBMOORE",
"ROBINKREGER",
"BETHGILBERT",
"RORYWEIE",
"DAVEROHMBOCK",
"DAVIDROHMBOCK",
"MICHELLEVALKO",
"AMYDUPRAS",
"WILLGUDELUNAS",
"SPENCERDIXON",
"SPENCERWORD",
"AARONKELLEY",
"ALEXBRYAN",
"ALEYNAHUNT",
"AYSETOKSOZ",
"BRIANVINES",
"C.TRAVISBUNNER",
"COLEMARTINIAK",
"COLEMOOTZ",
"ERINWILBER",
"GRACEKROEGER",
"JULIANARUBEN",
"KEVINWHITE",
"LILYJONES",
"MEGANSYMPSON",
"MEREDITHSTONE",
"TARAGIRI",
"THOMASSLABAUGH",
"LIZMARES",
"LIZKIM",
"ELIZABETHMARES-KIM",
"ELIZABETHKIM",
"RICHARDMAULIN",
"MARCORUBIO",
"RICKSCOTT",
"SCOTTWALKER",
"RANDPAUL",
"JOHNMCCAIN",
"MARSHABLACKBURN",
"ROBPORTMAN",
"BILLCASSIDY",
"CORYGARDNER",
"MATTBEVIN",
"TOMCOTTON",
"JONIERNST",
"ROYBLUNT",
"PATTOOMEY",
"ERICHOLCOMB",
"RONJOHNSON",
"DANSULLIVAN",
"JOSHHAWLEY",
"THOMTILLIS",
"LARRYHOGAN",
"DAVIDPERDUE",
"THADCOCHRAN",
"PATROBERTS",
"DONALDTRUMP",
"FELIXGRUCCI",
"TIMPAWLENTY",
"JARRETLEWIS",
"BILLMCLNTURFF",
"CHRISTOPHERANDREWS",
"CASSIEBAUSERMAN",
"TORIEBOLGER",
"BRADEBERSOLE",
"CHASEFOWERS",
"JULIAHALL",
"TORIEMILLER",
"KRISTIMILUSKI",
"NOAHRUDNICK",
"JONZAFF",
"SHAYNAENGLIN",
"MARYMACLEANASBILL",
"TESSVANDENDOLER",
"JOHNVINSON",
"AUSTINORR",
"JORDANPAWLICKI",
"RYANRESNICK",
"DREWDAHLBERG",
"NICKYTRUCIOS",
"DANIELGOROFF",
"KELSEYBULLS",
"MATTEBERIE",
"ADAMGELLER",
"DANIELLAGIAMBATTISTA",
"SAMANTHABARTHEL",
"DAVEPINE",
"CAROLEGROOM",
"DONHORSLEY",
"WARRENSLOCUM",
"DAVIDCANEPA",
"DAVINAHURT",
"WARRENLIEBERMAN",
"JULIAMATES",
"CHARLESSTONE",
"TOMMCCUNE",
"DIANEPAPAN",
"AMOURENCELEE",
"RICKBONILLA",
"JOEGOETHALS",
"ERICRODRIGUEZ",
"RICOMEDINA",
"IRENEO’CONNELL",
"MARTYMEDINA",
"LAURADAVIS",
"MICHAELSALAZAR",
"IANBAIN",
"DIANEHOWARD",
"ALICIAAGUIRRE",
"JANETBORGENS",
"GISELLEHALE",
"SHELLYMASUR",
"DIANAREDDY",
"RAYMONDBUENAVENTURA",
"GLENNSYLVESTER",
"JUSLYNMANALO",
"PAMELADIGIOVANNI",
"RODDAUS-MAGBUAL",
"KARYLMATSUMOTO",
"RICHGARBARINO",
"MARKADDIEGO",
"MARKNAGALES",
"BUENAFLORNICOLAS",
"REBECCAGREENE",
"DIANEBOWDY",
"MARKGARCEAU",
"LAURAAGOSTO",
"LAURENAMAIO",
"SELMAATTRIDE",
"ROWHANBAPTISTE",
"J.ANDREWBATCHELLER",
"AIDANBARRETT",
"ANDREWBAUMANN",
"FASHARRABRANAGAN",
"MARIOBROSSARD",
"MELISSABELL",
"MORGANBELL",
"ROBERTBIBEL",
"LAURENBIERMAN",
"BENJAMINBILENKI",
"ERINBILLINGS",
"PHILIPBOLTON",
"LAURENBORGHARD",
"MATTHEWBRIGSTOCK",
"DANIELBURKE",
"MATTCANTER",
"CELESTECARSWELL",
"ANGELACERVERAVICENZO",
"WILLISCHEN",
"JOHNCIPRIANI",
"JAMESDARLEY",
"SCOTTDAVIS",
"JAMESDELOREY",
"ANDREWDISANTO",
"GAVANDRISCOLL",
"ANNADURRETT",
"ERICEGAN",
"TAYLOREVANS",
"KERRIFAGAN",
"MAURAFARRELL",
"JOSEPHFERRIS",
"MARYANNEFORSYTHE",
"LACHLANFRANCIS",
"KATHERINEGARRITY",
"AKASHGEJJAGARAGUPPE",
"THERESAGILBERT",
"NICKGOUREVITCH",
"JASONGREEN",
"LARAHELM",
"JOSIAHHERNANDEZ",
"ANDREWHO",
"JULIEHOOTKIN",
"ALEXIVEY",
"NICOLEJACONETTY",
"TIFFANYJEFFREY",
"CARTERJOHNSON",
"ALEXANDERJONES",
"WILLJORDAN",
"JULIEJUNG",
"BENKEENAN",
"LIANAKLIPPEL",
"ANGELAKUEFLER",
"JUSTINLAPATINE",
"NATHANLEE",
"STEPHANIELERCH",
"MARCLITVINOFF",
"HILARYLYONS",
"JACOBMANSER",
"CALESHIAMARSON",
"MARJORIEMCCARTHY",
"TANYAMECK",
"CARLYMEYERSON",
"ROYOCCIOGROSSO",
"MARISSAPADILLA",
"JIMPAPA",
"LUKEPARTRIDGE",
"JEFFREYPLAUT",
"JEFREYPOLLOCK",
"JENNIFERREA",
"VICKYREING",
"ADAMRAPFOGEL",
"STEPHENRIGGS",
"AMYRONG",
"OLIVIAZAYASRYAN",
"JOHNSCHIUMO",
"STEPHENSIGMUND",
"JONSILVAN",
"JOANNATEITELBAUM",
"SHADTURNEY",
"WILLWARREN-O'BRIEN",
"DORISVILLEGAS",
"TJWETMORE",
"EMILYWILLIAMS",
"DREWWILLIAMS",
"MICHELLEWOODRUFF",
"SOPHIEWRIGHT",
"ALYSSAYEAGER",
"DANAYEGANIAN",
"YIYIN",
"JOANNAPINKERTON",
"EMILLEWILLIAMS",
"MATTHEWALLISON",
"PATRICKHARRIS",
"SOPHIAMOHR",
"SINDYMONDESIR",
"ANGELMUMMA",
"CHRISTINAWENDELL",
"ALEXISYAMOKOSKI",
"TRUDYBARTLEY",
"CRAIGTRENEFF",
"CATHYDEROSA",
"STEVENGLADMAN",
"THOMASGROTE",
"AMYLANDINO",
"MARLONMOORE",
"GINAORMOND",
"JEANRYAN",
"TIMOTHYSKINNER",
"MICHAELSTEVENS",
"KUMIWALKER",
"KATEADAMS",
"JEFFREYARNETT",
"CRAIGBAKER",
"SAMANTHIBALAJI",
"JIMBEALL",
"MARCBERMAN",
"INDALIBORA",
"ZACKBUGGUM",
"KARENCARY",
"BARRYCHANG",
"BARRYCHANGE",
"LIANG-FANGCHAO",
"BENCLAUSNITZER",
"JULIEDARWISH",
"MARYANNDEWAN",
"JOSEPHDISALVO",
"DONNADILLARD",
"BRYANEMMERT",
"DIANNEFEINSTEIN",
"MASONFONG",
"GREGGIGLIO",
"MICHAELGOLDMAN",
"CINDYGOODSELL",
"JIMGRIFFITH",
"KAMALAHARRIS",
"ANGESHAYMORE",
"GLENHENDRICKS",
"ANITAHERRMAN",
"ANITAHERRMANN",
"JERRYHILL",
"DIANNEHOLCOMB",
"MARIAJACKSON",
"ROSEMARYKAMEI",
"JHUMAKANUNGO",
"ANJALIKAUSAR",
"ROKHANNA",
"ROSAKIM",
"KATHLEENKING",
"LARRYKLEIN",
"LISAKORFF",
"ELENIKOUNALAKIS",
"GUSTAVLARSSON",
"EVANLOW",
"KRISTENLYN",
"ROXYMACHCUA",
"MICHELLEMAGINOT",
"GRACEMAH",
"SOMAMCCANDLESS",
"RUSSMELTON",
"SAMANTHAMILLAR",
"JEFFMOE",
"REIDMYERS",
"NAOMINAKANO-MATSUMOTO",
"NANCYNEWKIRK",
"GAVINNEWSOM",
"SARAHNOTCH",
"BARBARANUNES",
"EVELYNORTIZ",
"SHELLYOTA",
"JANAPARKER",
"DARCYPAUL",
"BENJAMINPICARD",
"LORIRIEHL",
"ROYROCKLIN",
"CATHLEENRODRIGUEZ",
"CLAUDIAROSSI",
"SUPRIYASABNE",
"SABEENSATTAR",
"STEVENSCHARF",
"WENDYSHARP",
"PHILSIEGEL",
"RODSINKS",
"NANCYSMITH",
"CYNTHIASMYTH",
"ANNASONG",
"NANCYSULLIVAN",
"JINHEESUN",
"DEBIETEXTOR",
"KAMITOMBERLAIN",
"SAVITAVAIDHYANATHAN",
"LISAVANMOUWERIK",
"ANNAVILLALOBOS",
"PHYLLISVOGEL",
"JAENNWANG",
"JANAWEAVER",
"HUNGWEI",
"CATHYWELPLY",
"JONWILLEY",
"BILLWILSON",
]
