// Générateur de routes avec trajectoires réalistes pour éviter les probl��mes d'API
class RouteGenerator {
  constructor() {
    // Système de notification des pauses actives
    this.activeBreakTimers = new Map();
    this.breakNotificationCallbacks = [];
    this.shownBreakNotifications = new Set(); // Éviter les doublons
    this.pausedTrucks = new Map(); // Camions en pause avec leur position sauvegardée

    // Routes prédéfinies pour la Tunisie (trajectoires réalistes)
   this.predefinedRoutes = {
  'TN-001': {
    // Tunis vers Sfax (Autoroute A1)
    startPoint: [36.770032, 10.23034], // Tunis
    endPoint: [36.785403, 10.190556],   // Sfax
    color: '#1e90ff',
    status: 'active',
  waypoints: [
    [36.770032, 10.23034],   // Départ: Ben Arous
    [36.769864, 10.230412],
    [36.76971, 10.230519],
    [36.769617, 10.230688],
    [36.7695, 10.230955],
    [36.76992, 10.231291],
    [36.769929, 10.231298],
    [36.770286, 10.231558],
    [36.77028, 10.231578],
    [36.77028, 10.231604],
    [36.77029, 10.231633],
    [36.770304, 10.231648],
    [36.770325, 10.231657],
    [36.770345, 10.231655],
    [36.770361, 10.231646],
    [36.770374, 10.23163],
    [36.770383, 10.231604],
    [36.770382, 10.231573],
    [36.770373, 10.231551],
    [36.770355, 10.231533],
    [36.770336, 10.231526],
    [36.770839, 10.22987],
    [36.770979, 10.229404],
    [36.771269, 10.228444],
    [36.77131, 10.228315],
    [36.771862, 10.226537],
    [36.77202, 10.225994],
    [36.772141, 10.22556],
    [36.772176, 10.225495],
    [36.77227, 10.225205],
    [36.7723, 10.225067],
    [36.772312, 10.224953],
    [36.772329, 10.224935],
    [36.772352, 10.224895],
    [36.772366, 10.224848],
    [36.772368, 10.224799],
    [36.772352, 10.224735],
    [36.772318, 10.224683],
    [36.772271, 10.224652],
    [36.772224, 10.224644],
    [36.772177, 10.224658],
    [36.772123, 10.224608],
    [36.772075, 10.224539],
    [36.772014, 10.224423],
    [36.77197, 10.224319],
    [36.771945, 10.22425],
    [36.771773, 10.2238],
    [36.771742, 10.223719],
    [36.77148, 10.223044],
    [36.771433, 10.222943],
    [36.771388, 10.222861],
    [36.771337, 10.222816],
    [36.77129, 10.222681],
    [36.771171, 10.222352],
    [36.771073, 10.222106],
    [36.77098, 10.221936],
    [36.770889, 10.221799],
    [36.77074, 10.221637],
    [36.770595, 10.221506],
    [36.770243, 10.221274],
    [36.769939, 10.22106],
    [36.769597, 10.220829],
    [36.769459, 10.220734],
    [36.769435, 10.22068],
    [36.769431, 10.220675],
    [36.769424, 10.220665],
    [36.769148, 10.220462],
    [36.768641, 10.22011],
    [36.768229, 10.219836],
    [36.768018, 10.219691],
    [36.768004, 10.219683],
    [36.767918, 10.219624],
    [36.767656, 10.219452],
    [36.767469, 10.219323],
    [36.767331, 10.219264],
    [36.767255, 10.219231],
    [36.767173, 10.2192],
    [36.767165, 10.219178],
    [36.767187, 10.219017],
    [36.767235, 10.218864],
    [36.767268, 10.218764],
    [36.767359, 10.218531],
    [36.767443, 10.218327],
    [36.767745, 10.217629],
    [36.768036, 10.216922],
    [36.768317, 10.216267],
    [36.768606, 10.21562],
    [36.768622, 10.215579],
    [36.768639, 10.215534],
    [36.768738, 10.215307],
    [36.769047, 10.21461],
    [36.769231, 10.214169],
    [36.770297, 10.211615],
    [36.770656, 10.210761],
    [36.771088, 10.20973],
    [36.77128, 10.209263],
    [36.771665, 10.208327],
    [36.771697, 10.208246],
    [36.771742, 10.208134],
    [36.771917, 10.207724],
    [36.772022, 10.207482],
    [36.772844, 10.205514],
    [36.772869, 10.205454],
    [36.772899, 10.205394],
    [36.772924, 10.205349],
    [36.77294, 10.205326],
    [36.772957, 10.205306],
    [36.772972, 10.20526],
    [36.772986, 10.205244],
    [36.772995, 10.205223],
    [36.772999, 10.2052],
    [36.772999, 10.205176],
    [36.773034, 10.205005],
    [36.77338, 10.20411],
    [36.773987, 10.20271],
    [36.774176, 10.202245],
    [36.774253, 10.202139],
    [36.774281, 10.202117],
    [36.774301, 10.202084],
    [36.774312, 10.202045],
    [36.77438, 10.201926],
    [36.774552, 10.201731],
    [36.774693, 10.20159],
    [36.774841, 10.201462],
    [36.775045, 10.201266],
    [36.775381, 10.200956],
    [36.775704, 10.200666],
    [36.776212, 10.200201],
    [36.776404, 10.20002],
    [36.777087, 10.199384],
    [36.77734, 10.199155],
    [36.777598, 10.198909],
    [36.778099, 10.198437],
    [36.779083, 10.197536],
    [36.779288, 10.197323],
    [36.779631, 10.196937],
    [36.779879, 10.196658],
    [36.780321, 10.1962],
    [36.780545, 10.195952],
    [36.780974, 10.195479],
    [36.78152, 10.194889],
    [36.781529, 10.194879],
    [36.781801, 10.194548],
    [36.782008, 10.194265],
    [36.782435, 10.193704],
    [36.783006, 10.192939],
    [36.783124, 10.192783],
    [36.783234, 10.192638],
    [36.78364, 10.19208],
    [36.783862, 10.191774],
    [36.78403, 10.191549],
    [36.784227, 10.191317],
    [36.784436, 10.191122],
    [36.784491, 10.191064],
    [36.784649, 10.190954],
    [36.784912, 10.190801],
    [36.785403, 10.190556]
    // ... (vous pouvez ajouter plus de points si nécessaire)
],
    breakPoints: [2, 4] // Points de pause
  },
  'TN-002': {
   startPoint: [36.860392, 10.110538], // Départ Ariana
    endPoint: [36.856999, 10.116343],      // Arrivée Monastir

    color: '#22c55e',
    status: 'completed',
    waypoints: [
          [36.860392, 10.110538],
        [36.860243, 10.110708],
        [36.859873, 10.111135],
        [36.859477, 10.111589],
        [36.858991, 10.11214],
        [36.858597, 10.112591],
        [36.858392, 10.112827],
        [36.858144, 10.113096],
        [36.858075, 10.113169],
        [36.857856, 10.113399],
        [36.857817, 10.113443],
        [36.857743, 10.113515],
        [36.857687, 10.113574],
        [36.857376, 10.113924],
        [36.857224, 10.114078],
        [36.857121, 10.114172],
        [36.857007, 10.114275],
        [36.856938, 10.114369],
        [36.856876, 10.114496],
        [36.85682, 10.114673],
        [36.856785, 10.114854],
        [36.856759, 10.114999],
        [36.856756, 10.11514],
        [36.856745, 10.115245],
        [36.856802, 10.115347],
        [36.856833, 10.115416],
        [36.856848, 10.115479],
        [36.856855, 10.115558],
        [36.856861, 10.115696],
        [36.856864, 10.115837],
        [36.856876, 10.115882],
        [36.856883, 10.115905],
        [36.856902, 10.115945],
        [36.856935, 10.116056],
        [36.856967, 10.116187],
        [36.856999, 10.116343]
    ],
    breakPoints: [3, 4],  // Points de pause rapprochés (anciennement [3, 20, 30])
    breakPoints: [2, 4, 8]  // Ajoute une pause à [36.770286, 10.231558]
},
  'TN-003': {
    // Ariana vers Kairouan (Route intérieure)
    startPoint: [36.500419, 10.83127], // Nabeul
    endPoint: [36.475394, 10.794052],   // Bizert
    color: '#1e90ff',
    status: 'active',
    waypoints: [
[36.500419, 10.83127],
        [36.500805, 10.830647],
        [36.501157, 10.830079],
        [36.501411, 10.830328],
        [36.501422, 10.830335],
        [36.501434, 10.830336],
        [36.501448, 10.830332],
        [36.501463, 10.830311],
        [36.501668, 10.829876],
        [36.501754, 10.829694],
        [36.50177, 10.829674],
        [36.501789, 10.829657],
        [36.501841, 10.829632],
        [36.501867, 10.829626],
        [36.501903, 10.829631],
        [36.501921, 10.829641],
        [36.502101, 10.829803],
        [36.50212, 10.82981],
        [36.502143, 10.829811],
        [36.502164, 10.829803],
        [36.502187, 10.829788],
        [36.502236, 10.829729],
        [36.502329, 10.829629],
        [36.502432, 10.829543],
        [36.502479, 10.829521],
        [36.502505, 10.829521],
        [36.502531, 10.829527],
        [36.502629, 10.829591],
        [36.502651, 10.829594],
        [36.50268, 10.829586],
        [36.502802, 10.829517],
        [36.502817, 10.829512],
        [36.502834, 10.82951],
        [36.502957, 10.829537],
        [36.503165, 10.829592],
        [36.503186, 10.829594],
        [36.503206, 10.829588],
        [36.503224, 10.82957],
        [36.503741, 10.828836],
        [36.503981, 10.828442],
        [36.504249, 10.827965],
        [36.504558, 10.828149],
        [36.504603, 10.828052],
        [36.503196, 10.827207],
        [36.500589, 10.825705],
        [36.497814, 10.824065],
        [36.497738, 10.82402],
        [36.496703, 10.823347],
        [36.496379, 10.823114],
        [36.495612, 10.82256],
        [36.494285, 10.821433],
        [36.493611, 10.820816],
        [36.493157, 10.82038],
        [36.491087, 10.818251],
        [36.490668, 10.817819],
        [36.490356, 10.817457],
        [36.490048, 10.817064],
        [36.489739, 10.816638],
        [36.48955, 10.816346],
        [36.488208, 10.814258],
        [36.487664, 10.813486],
        [36.48688, 10.81251],
        [36.486784, 10.81237],
        [36.486742, 10.812277],
        [36.48671, 10.812184],
        [36.48671, 10.812175],
        [36.486709, 10.812161],
        [36.486698, 10.812101],
        [36.486674, 10.812048],
        [36.486638, 10.812005],
        [36.486595, 10.811976],
        [36.486576, 10.81197],
        [36.486431, 10.811897],
        [36.486311, 10.81181],
        [36.484986, 10.810263],
        [36.484698, 10.809906],
        [36.484464, 10.809546],
        [36.484253, 10.809171],
        [36.484058, 10.808791],
        [36.483887, 10.808386],
        [36.483736, 10.807961],
        [36.483322, 10.806695],
        [36.483131, 10.806154],
        [36.482947, 10.80571],
        [36.482616, 10.805006],
        [36.482395, 10.804591],
        [36.482037, 10.803978],
        [36.481455, 10.803069],
        [36.48117, 10.802638],
        [36.479987, 10.800903],
        [36.479274, 10.799819],
        [36.477909, 10.797674],
        [36.477908, 10.797615],
        [36.47789, 10.79756],
        [36.477858, 10.797516],
        [36.477816, 10.797489],
        [36.477769, 10.797481],
        [36.477555, 10.797196],
        [36.475835, 10.794816],
        [36.475733, 10.794667],
        [36.475637, 10.794511],

        [36.475556, 10.794358],
        [36.475475, 10.794205],
        [36.475394, 10.794052],
        [ 36.475547, 10.794348],
 [36.475464, 10.794182],
[ 36.475387, 10.794012],
[ 36.475301, 10.793815],
[ 36.475464, 10.794182],
[ 36.475387, 10.794012],
[ 36.475301, 10.793815],
 [ 36.475181, 10.794182],
[ 36.475387, 10.794012],
[ 36.475301, 10.793815],
[ 36.475181, 10.794012],
[ 36.475301, 10.793815],
[ 36.475301, 10.793815],
[ 36.475181, 10.793815],
[ 36.475181, 10.793469],
 [ 36.47516, 10.793392],
[ 36.475108, 10.792972],
 [ 36.475118, 10.79293],
[ 36.475119, 10.792886],
[ 36.47511, 10.792844],
 [ 36.475092, 10.792807],
[ 36.475066, 10.792777],
 [ 36.474971, 10.792457],
[ 36.474961, 10.792287],
[ 36.474954, 10.792116],
[ 36.474951, 10.791945],
[ 36.474954, 10.791754],
[ 36.47496, 10.791535],
[ 36.475123, 10.789591],
[36.475177, 10.788942],
 [36.475204, 10.788606],
[36.475225, 10.788379],
[36.475345, 10.787049],
[36.475374, 10.786729],
[36.475401, 10.786715],
[36.475421, 10.786698],
[36.475438, 10.786675],
[36.475452, 10.786649],
[36.475461, 10.78662],
[36.475465, 10.786589],
[36.475463, 10.786555],
[36.475456, 10.786523],
[36.475444, 10.786493], 
[36.475432, 10.786364],
[36.475427, 10.786286],
[36.475427, 10.786207],
[36.475432, 10.786128],
[36.475528, 10.784842],
[36.475551, 10.784564],
 [36.47557, 10.784285],
[36.475584, 10.784005],
[36.475594, 10.783725],
 [36.475599, 10.783445],
 [36.475598, 10.783185],
 [36.475593, 10.782924], 
 [36.475583, 10.782694],
[36.475569, 10.782463],
[36.47555, 10.782233], 
 [36.475527, 10.782004],
 [36.475499, 10.781775],
[36.475467, 10.781548],
 [36.475425, 10.781239],
[36.475372, 10.780933],
[36.475312, 10.780629],
[36.475245, 10.780327],
[36.47517, 10.780028],
[36.475089, 10.779732],
[36.475, 10.77944],
[36.474904, 10.77915],
[36.474801, 10.778865],
[36.474662, 10.778508],
[36.474625, 10.778396], 
[36.474601, 10.778319],
[36.474585, 10.778226],
 [36.474598, 10.778176], 
[36.474598, 10.778123],
[36.474587, 10.778073], 
 [36.474562, 10.778024],
[36.474525, 10.777988],
[36.474482, 10.777968], 
[36.474435, 10.777921],
[36.474394, 10.777871],
[36.473, 10.774922],
 [36.472348, 10.773586],
[36.472112, 10.773074], 
[36.471878, 10.77256],
[36.471647, 10.772045],
[36.471058, 10.770657],
[36.470645, 10.769623],
[36.470597, 10.769522],
 [36.470542, 10.769426], 
 [36.470481, 10.769338],
 [36.470413, 10.769256],
[36.469833, 10.767858],
[36.469489, 10.767051],
[36.469258, 10.766446], 
 [36.469125, 10.766073], 
[36.468973,10.765604], 
[36.46886,10.765166], 
[36.468671,10.764444],  
[36.468551,10.763944], 
[36.46848,10.763657],

[36.468425,10.763447],
[36.468387,10.763292],
 [36.46831,10.762978],
 [36.468273,10.762718],
[36.468269,10.762551],
[36.468273,10.762411],
[36.468332,10.76227],
[36.46834,10.76224],
 [36.468353,10.762189],
[36.468353,10.762102],
 [36.46836,10.761956],
 [36.468393,10.761818],
 [36.468473,10.761666],
 [36.46864,10.761382],
 [36.468997,10.760816],
 [36.469239,10.760474],
 [36.469342,10.760335],
 [36.46951,10.760107],
 [36.469613,10.759985],
 [36.469829,10.759736],
[36.470188,10.759319],
 [36.470701,10.758801],
 [36.471113,10.758455],
[36.471466,10.758167],
[36.471754,10.757943],
 [36.471992,10.757758],
 [36.472471,10.757392],
 [36.473121,10.756819],
 [36.473381,10.756554],
[36.473751,10.756122],
[36.474146,10.755606],
[36.4744,10.755235],
[36.474649,10.754886],
[36.474745,10.754787],
[36.474795,10.754762],
[36.474835,10.754718],
[36.474855,10.754677],
 [36.474867,10.75463],
[36.474869,10.754581],
[36.47486,10.75453],
 [36.474902,10.754408],
 [36.474951,10.754318],
[36.475024,10.754188],
[36.475118,10.753996],
 [36.475193,10.753858],
[36.475256,10.753715],
 [36.475312,10.753588],
 [36.475359,10.753482],
[36.475412,10.753282],
[36.475456,10.753106],
 [36.47552,10.752814],
 [36.47556,10.752511],
 [36.475584,10.752186],
 [36.475584,10.751941],
[36.475586,10.751822],
 [36.475565,10.751543],
[36.475516,10.751181],
[36.475437,10.750838],
[36.475303,10.75043],
 [36.474339,10.747601],
[36.473602,10.745444],
[36.473493,10.74513],
[36.473387,10.744608],
[36.473382,10.74455],
 [36.473364,10.744497],
 [36.473335,10.744452],
[36.473296,10.744419],
[36.473052,10.744039],
 [36.472523,10.742874],
 [36.472004,10.741691],
[36.471665,10.740936],
 [36.471466,10.74053],
[36.471198,10.740019],
[36.470738,10.739192],
[36.470535,10.738803],
 [36.470306,10.738307],
[36.470166,10.737965],
 [36.470087,10.737719], 
 [36.469793,10.736499],
 [36.469731,10.736136],
 [36.46965,10.73572],
 [36.469564,10.735406],
[36.469429,10.735057],
 [36.469256,10.734685],
[36.468979,10.734203],
 [36.468777,10.733872],
 [36.468557,10.733461],
[36.468416,10.733151],
 [36.468196,10.732548],
 [36.468025,10.731918],
 [36.467855,10.731257],
 [36.467836,10.731143],
 [36.46783,10.731052],
[36.467885,10.730862],
[36.467894,10.730815],
 [36.467894,10.730768],
 [36.467884,10.730717],
 [36.467863,10.730672],
[36.467834,10.730634],
[36.467786,10.730461],
[36.467761,10.73036],
[36.467749,10.730156],
[36.467749,10.729793],
[36.46777,10.728112],
[36.467772,10.727675],
 [36.467824,10.727293],
 
 [36.467911,10.726832],
[36.467999,10.726466],
 [36.468121,10.726088],

    ],
    breakPoints: [3, 6] // Nouveaux points de pause (décalage de -4 pour le premier)
  },
  'TN-004': {
    // La Goulette vers Nabeul (Route côtière touristique)
    startPoint: [36.7538, 10.2286], // La Goulette
    endPoint: [36.4561, 10.7376],   // Nabeul
    color: '#1e90ff',
    status: 'active',
    waypoints: [
      [36.7538, 10.2286], // La Goulette départ
      [36.7556, 10.2323], // Port direction
      [36.7578, 10.2367], // Khereddine
      [36.7598, 10.2423], // Carthage entrée
      [36.7623, 10.2478], // Carthage musée
      [36.7645, 10.2534], // Sidi Bou Said
      [36.7667, 10.2589], // Villa Blanche
      [36.7689, 10.2645], // La Marsa
      [36.7712, 10.2701], // Gammarth - Point pause 1
      [36.7734, 10.2756], // Route côtière
      [36.7756, 10.2812], // Raoued
      [36.7778, 10.2867], // Zone touristique
      [36.7801, 10.2923], // Kalâat el-Andalous
      [36.7823, 10.2978], // Soliman
      [36.7845, 10.3034], // Menzel Bouzelfa
      [36.7867, 10.3089], // Bou Argoub
      [36.7889, 10.3145], // Hammamet Nord - Point pause 2
      [36.7912, 10.3201],
      [36.7934, 10.3256], // Hammamet centre
      [36.7956, 10.3312], // Yasmine Hammamet
      [36.7978, 10.3367], // Nabeul direction
      [36.8001, 10.3423], // Nabeul Nord
      [36.8023, 10.3478], // Centre artisanal
      [36.8045, 10.3534], // Béni Khiar
      [36.4561, 10.7376]  // Nabeul centre
    ],
    // breakPoints: [3, 16] // Points de pause
  },
  'TN-005': {
    // Sfax vers Gabès (Route GP1 du Sud)
    startPoint: [34.7406, 10.7603], // Sfax
    endPoint: [33.8869, 10.0982],   // Gabès
    color: '#f59e0b',
    status: 'maintenance',
    waypoints: [
      [34.7406, 10.7603], // Sfax centre départ
      [34.7334, 10.7456], // Sortie Sfax Sud
      [34.7267, 10.7323], // Route GP1
      [34.7189, 10.7178], // Sakiet Ezzit
      [34.7123, 10.7045], // El Amra
      [34.7056, 10.6912], // Mahres direction
      [34.6989, 10.6778], // Mahres centre
      [34.6923, 10.6645], // Skhira approche
      [34.6856, 10.6512], // Skhira - Point pause 1
      [34.6789, 10.6378],
      [34.6723, 10.6245], // Ghraiba
      [34.6656, 10.6112],
      [34.6589, 10.5978], // El Hencha
      [34.6523, 10.5845],
      [34.6456, 10.5712], // Bouchemma
      [34.6389, 10.5578],
      [34.6323, 10.5445], // Gafsa junction
      [34.6256, 10.5312], // Métarech - Point pause 2
      [34.6189, 10.5178],
      [34.6123, 10.5045], // Gabès Nord
      [34.6056, 10.4912],
      [34.5989, 10.4778], // Chenini Nahal
      [34.5923, 10.4645],
      [34.5856, 10.4512], // Oudhref
      [34.5789, 10.4378],
      [34.5723, 10.4245], // Métouia
      [34.5656, 10.4112],
      [33.8869, 10.0982]  // Gabès centre
    ],
    // breakPoints: [2, 17] // Points de pause
  }
};
  }

  // Générer route avec animation progressive
  generateRouteWithProgress(truckId, progress = 0) {
    const routeData = this.predefinedRoutes[truckId];
    if (!routeData) {
      console.warn(`⚠️ Route non trouvée pour ${truckId}`);
      return null;
    }

    const waypoints = routeData.waypoints;
    const totalPoints = waypoints.length;
    
    // Calculer position actuelle selon progression
    const progressIndex = Math.floor((progress / 100) * (totalPoints - 1));
    const nextIndex = Math.min(progressIndex + 1, totalPoints - 1);
    
    // Interpolation entre deux points
    const progressBetween = ((progress / 100) * (totalPoints - 1)) % 1;
    const currentPoint = waypoints[progressIndex];
    const nextPoint = waypoints[nextIndex];
    
    let currentPosition;
    if (progressBetween === 0 || progressIndex === nextIndex) {
      currentPosition = currentPoint;
    } else {
      currentPosition = [
        currentPoint[0] + (nextPoint[0] - currentPoint[0]) * progressBetween,
        currentPoint[1] + (nextPoint[1] - currentPoint[1]) * progressBetween
      ];
    }

    return {
      fullRoute: waypoints,
      currentPosition: currentPosition,
      completedRoute: waypoints.slice(0, progressIndex + 1),
      remainingRoute: waypoints.slice(progressIndex),
      color: routeData.color,
      status: routeData.status,
      progress: progress
    };
  }

  // Générer toutes les routes avec couleurs appropriées
  generateAllRoutes(trucks) {
    const routes = {};
    
    trucks.forEach(truck => {
      const routeInfo = this.generateRouteWithProgress(
        truck.truck_id, 
        truck.route_progress || 0
      );
      
      if (routeInfo) {
        // Déterminer couleur selon état
        let routeColor = routeInfo.color;
        if (truck.state === 'En Route') {
          routeColor = '#1e90ff'; // Bleu pour actifs
        } else if (truck.state === 'At Destination') {
          routeColor = '#22c55e'; // Vert pour terminés
        } else if (truck.state === 'Maintenance') {
          routeColor = '#f59e0b'; // Orange pour maintenance
        } else if (truck.state === 'Delayed') {
          routeColor = '#ef4444'; // Rouge pour retardés
        } else {
          routeColor = '#9ca3af'; // Gris pour autres états
        }
        routes[truck.truck_id] = {
          ...routeInfo,
          color: routeColor,
          truck: truck
        };
      }
    });
    
    return routes;
  }

  // Créer ligne de route avec style selon état
  createRoutePolyline(routeInfo, isSelected = false) {
    if (!routeInfo || !routeInfo.fullRoute) return null;

    const baseWeight = isSelected ? 6 : 4;
    const opacity = routeInfo.status === 'completed' ? 0.7 : 0.9;
    
    // Style selon état
    const lineStyle = {
      color: routeInfo.color,
      weight: baseWeight,
      opacity: opacity,
      lineCap: 'round',
      lineJoin: 'round'
    };
    
    // Ligne discontinue pour trajets terminés
    if (routeInfo.status === 'completed') {
      lineStyle.dashArray = '12, 8';
    }
    
    // Style statique pour tous les trajets (plus d'animation)
    if (routeInfo.status === 'active' && isSelected) {
      lineStyle.weight = baseWeight + 1;
    }

    return lineStyle;
  }

  // Points d'étapes avec informations
  createRouteMarkers(routeInfo) {
    if (!routeInfo || !routeInfo.fullRoute) return [];

    const markers = [];
    const waypoints = routeInfo.fullRoute;
    
    // Marqueur de départ
    markers.push({
      position: waypoints[0],
      type: 'start',
      icon: '🟢',
      popup: `<div style="text-align: center; font-family: sans-serif;">
        <strong>🟢 Point de Départ</strong><br>
        <span style="font-size: 12px;">${routeInfo.truck?.pickup?.address || 'Départ'}</span>
      </div>`
    });
    
    // Marqueur d'arrivée
    markers.push({
      position: waypoints[waypoints.length - 1],
      type: 'end',
      icon: '🔴',
      popup: `<div style="text-align: center; font-family: sans-serif;">
        <strong>🔴 Destination</strong><br>
        <span style="font-size: 12px;">${routeInfo.truck?.destination || 'Arrivée'}</span><br>
        <span style="font-size: 10px; color: #666;">ETA: ${routeInfo.truck?.estimatedArrival ? new Date(routeInfo.truck.estimatedArrival).toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'}) : 'N/A'}</span>
      </div>`
    });
    
    // Points d'étapes intermédiaires (tous les 2-3 points)
    for (let i = 2; i < waypoints.length - 2; i += 3) {
      markers.push({
        position: waypoints[i],
        type: 'waypoint',
        icon: '🔵',
        popup: `<div style="text-align: center; font-family: sans-serif;">
          <strong>🔵 Point d'Étape</strong><br>
          <span style="font-size: 10px;">Étape ${Math.floor(i/2) + 1}</span>
        </div>`
      });
    }
    
    return markers;
  }

  // Obtenir position actuelle du camion sur sa route
  getCurrentTruckPosition(truckId, progress) {
    const routeInfo = this.generateRouteWithProgress(truckId, progress);
    return routeInfo ? routeInfo.currentPosition : null;
  }

  // Calculer direction du camion (pour orientation de l'icône)
  calculateBearing(truckId, progress) {
    const routeInfo = this.generateRouteWithProgress(truckId, progress);
    if (!routeInfo || !routeInfo.fullRoute) return 0;

    const waypoints = routeInfo.fullRoute;
    const totalPoints = waypoints.length;
    const progressIndex = Math.floor((progress / 100) * (totalPoints - 1));
    const nextIndex = Math.min(progressIndex + 1, totalPoints - 1);

    if (progressIndex === nextIndex) return 0;

    const current = waypoints[progressIndex];
    const next = waypoints[nextIndex];

    const deltaLat = next[0] - current[0];
    const deltaLng = next[1] - current[1];

    let bearing = Math.atan2(deltaLng, deltaLat) * (180 / Math.PI);
    bearing = (bearing + 360) % 360;

    return bearing;
  }

  // Système de points de pause de 45min
  checkBreakPoint(truckId, progress) {
    const routeData = this.predefinedRoutes[truckId];
    if (!routeData || !routeData.breakPoints) return null;

    const waypoints = routeData.waypoints;
    const totalPoints = waypoints.length;
    const currentIndex = Math.floor((progress / 100) * (totalPoints - 1));

    // Vérifier si le camion approche d'un point de pause
    const nearBreakPoint = routeData.breakPoints.find(breakIndex => {
      const distance = Math.abs(currentIndex - breakIndex);
      return distance <= 2; // Dans un rayon de 2 points
    });

    if (nearBreakPoint) {
      const breakPosition = waypoints[nearBreakPoint];
      const breakNumber = routeData.breakPoints.indexOf(nearBreakPoint) + 1;

      return {
        required: true,
        position: breakPosition,
        breakNumber: breakNumber,
        message: `Pause requise: 45min avant de continuer (Point ${breakNumber})`,
        duration: 45, // minutes
        type: 'mandatory_break'
      };
    }

    return null;
  }

  // Générer notification de pause (max 2 fois par point)
  generateBreakNotification(truckId, progress) {
    const breakInfo = this.checkBreakPoint(truckId, progress);
    if (!breakInfo) return null;

    const notificationKey = `${truckId}-break-${breakInfo.breakNumber}`;

    // Vérifier si cette notification a déjà été montrée plus de 2 fois
    const showCount = this.shownBreakNotifications.has(notificationKey) ?
      parseInt(notificationKey.split('-')[3] || '0') : 0;

    if (showCount >= 2) return null; // Maximum 2 affichages

    // Marquer comme affiché
    this.shownBreakNotifications.add(`${notificationKey}-${showCount + 1}`);

    return {
      id: `break-${truckId}-${breakInfo.breakNumber}-${Date.now()}`,
      type: 'break_notification',
      title: '🚦 Pause Obligatoire',
      message: breakInfo.message,
      truckId: truckId,
      position: breakInfo.position,
      duration: breakInfo.duration,
      severity: 'warning',
      icon: '⏳',
      timestamp: new Date().toISOString(),
      autoClose: false,
      showCount: showCount + 1
    };
  }

  // Obtenir les marqueurs de pause pour la carte
  getBreakPointMarkers(truckId) {
    const routeData = this.predefinedRoutes[truckId];
    if (!routeData || !routeData.breakPoints) return [];

    return routeData.breakPoints.map((breakIndex, idx) => {
      const position = routeData.waypoints[breakIndex];
      return {
        position: position,
        type: 'break_point',
        icon: '��',
        popup: `<div style="text-align: center; font-family: sans-serif;">
          <strong>🚦 Point de Pause ${idx}</strong><br>
          <span style="font-size: 12px; color: #f59e0b;">Durée: 45 minutes</span><br>
          <span style="font-size: 10px; color: #6b7280;">Obligatoire pour sécurité</span>
        </div>`
      };
    });
  }

  // Mettre un camion en pause
  pauseTruck(truckId, currentProgress, currentPosition) {
    this.pausedTrucks.set(truckId, {
      pausedAt: Date.now(),
      progress: currentProgress,
      position: currentPosition,
      isPaused: true
    });
    console.log(`🚦 Camion ${truckId} mis en pause à ${currentProgress}%`);
  }

  // Reprendre un camion depuis sa position d'arrêt
  resumeTruck(truckId) {
    if (this.pausedTrucks.has(truckId)) {
      const pauseData = this.pausedTrucks.get(truckId);
      this.pausedTrucks.delete(truckId);
      console.log(`▶️ Camion ${truckId} reprend depuis ${pauseData.progress}%`);
      return pauseData;
    }
    return null;
  }

  // Vérifier si un camion est en pause
  isTruckPaused(truckId) {
    return this.pausedTrucks.has(truckId);
  }

  // Obtenir les données de pause d'un camion
  getTruckPauseData(truckId) {
    return this.pausedTrucks.get(truckId);
  }
}

const routeGenerator = new RouteGenerator();
export default routeGenerator;
