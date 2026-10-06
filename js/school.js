import { GPA_BUCKETS, renderGpaHistogram, normalizeGpaDistribution, classRankSegments, renderClassRankHistogram } from './charts.js?v=6';

const SCHOOL_META = {
  'mit': { color: '#a41931', banner: 'mit.jpg', credit: { author: 'EgorovaSvetlana', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Cambridge_Boston_Skylines_Charles_River_Esplanade.jpg' } },
  'harvard': { color: '#a6152c', banner: 'harvard.jpg', credit: { author: 'Matthias Rosenkranz', license: 'CC BY-SA 2.0', url: 'https://commons.wikimedia.org/wiki/File:Boston_Skyline_Over_the_Charles_River.jpg' } },
  'stanford': { color: '#8c1515', banner: 'stanford.jpg', credit: { author: 'Victorgrigas', license: 'CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:San_Francisco_as_seen_from_Bernal_Heights.jpg' } },
  'princeton': { color: '#ed6d0b', banner: 'princeton.jpg', credit: { author: 'Peter Brown (uploader: Peetlesnumber1)', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Center_City_Philadelphia_2018.jpg' } },
  'yale': { color: '#00356b', banner: 'yale.jpg', credit: { author: 'Charles Barneby', license: 'Public domain (self-released by photographer)', url: 'https://commons.wikimedia.org/wiki/File:New_Haven_Skyline.jpg' } },
  'columbia': { color: '#6dabe4', banner: 'columbia.jpg', credit: { author: 'King of Hearts', license: 'CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:Lower_Manhattan_from_Jersey_City_November_2014_panorama_2.jpg' } },
  'upenn': { color: '#00144d', banner: 'upenn.jpg', credit: { author: 'Mefman00', license: 'CC0 1.0', url: 'https://commons.wikimedia.org/wiki/File:Philadelphia_skyline_from_South_Street_Bridge.jpg' } },
  'caltech': { color: '#ff6e1e', banner: 'caltech.jpg', credit: { author: 'Dave Parker (Parkerdr)', license: 'CC BY 3.0', url: 'https://commons.wikimedia.org/wiki/File:LosAngelesPanorama2007.jpg' } },
  'duke': { color: '#363d2e', banner: 'duke.jpg', credit: { author: 'Ildar Sagdejev (Specious)', license: 'CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:Durham_skyline_banner.jpg' } },
  'jhu': { color: '#918f88', banner: 'jhu.jpg', credit: { author: 'Jerry (Flickr user, Flickr ID 14976045@N02)', license: 'CC BY 2.0', url: 'https://commons.wikimedia.org/wiki/File:Baltimore_Inner_Harbor_Sunny_Day_360_Panorama_(2942076916).jpg' } },
  'northwestern': { color: '#4e2686', banner: 'northwestern.jpg', credit: { author: 'Buphoff', license: 'CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:Chicago_Skyline_Hi-Res.jpg' } },
  'dartmouth': { color: '#00693e', banner: 'dartmouth.jpg', credit: { author: 'Šarūnas Burdulis', license: 'CC BY-SA 2.0', url: 'https://commons.wikimedia.org/wiki/File:Baker_Tower_Panorama_(10292276743).jpg' } },
  'brown': { color: '#a9afb4', banner: 'brown.jpg', credit: { author: 'Chris Rycroft', license: 'CC BY 2.0', url: 'https://commons.wikimedia.org/wiki/File:Downtown_Providence_buildings_and_Providence_River_-_51767023532.jpg' } },
  'vanderbilt': { color: '#aeb1b7', banner: 'vanderbilt.jpg', credit: { author: 'Casey Fleser', license: 'CC BY 2.0', url: 'https://commons.wikimedia.org/wiki/File:Nashville_From_Fort_Negley.jpg' } },
  'rice': { color: '#002169', banner: 'rice.jpg', credit: { author: 'Henry Han', license: 'CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:Panoramic_Houston_skyline.jpg' } },
  'washu': { color: '#a60c10', banner: 'washu.jpg', credit: { author: 'Bohao Zhao', license: 'CC BY 3.0', url: 'https://commons.wikimedia.org/wiki/File:St._Louis_Skyline_from_Illinois_-_panoramio.jpg' } },
  'notre-dame': { color: '#7f8883', banner: 'notre-dame.jpg', credit: { author: 'Amanda Govaert', license: 'CC BY 2.0', url: 'https://commons.wikimedia.org/wiki/File:Downtown_south_bend_(1298311120).jpg' } },
  'cornell': { color: '#b31b1b', banner: 'cornell.jpg', credit: { author: 'Gülməmməd (Gulmammad)', license: 'CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:Skyline_of_Cornell_over_Mohawk_Valley,_Ithaca_NY.jpg' } },
  'uchicago': { color: '#a6152c', banner: 'uchicago.jpg', credit: { author: 'Clay Gilliland', license: 'CC BY-SA 2.0', url: 'https://commons.wikimedia.org/wiki/File:Chicago_from_Grant_Park_(16841999588).jpg' } },
  'cmu': { color: '#c41230', banner: 'cmu.jpg', credit: { author: 'Dllu', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Pittsburgh_city_pano_2015.jpg' } },
  'georgetown': { color: '#041e42', banner: 'georgetown.jpg', credit: { author: 'User:Tomf688 (Tom)', license: 'CC BY-SA 2.5', url: 'https://commons.wikimedia.org/wiki/File:Skyline_of_Washington,_seen_from_Saint_Elizabeths,_August_23,_2006.jpg' } },
  'emory': { color: '#002878', banner: 'emory.jpg', credit: { author: 'London looks', license: 'CC BY 2.0', url: 'https://commons.wikimedia.org/wiki/File:Downtown_Atlanta_skyline_panorama.jpg' } },
  'wake-forest': { color: '#919392', banner: 'wake-forest.jpg', credit: { author: 'Indy beetle', license: 'CC0 1.0', url: 'https://commons.wikimedia.org/wiki/File:Winston-Salem_skyline.jpg' } },
  'tufts': { color: '#3172ae', banner: 'tufts.jpg', credit: { author: 'Eric Baetscher (Fcb981)', license: 'CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:Boston_Skyline_Panorama_Dusk.jpg' } },
  'ucla': { color: '#017dc3', banner: 'ucla.jpg', credit: { author: 'Daniel L. Lu (dllu)', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Skyline_of_Los_Angeles_from_Griffith_Observatory_dllu.jpg' } },
  'berkeley': { color: '#193460', banner: 'berkeley.jpg', credit: { author: 'Aos.1905', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:View_of_the_Berkeley_and_San_Francisco_Bay_from_Sather_Tower_(The_Campanile)_in_UC_Berkeley.jpg' } },
  'ucsb': { color: '#7a4b40', banner: 'ucsb.jpg', credit: { author: 'Eugene Zelenko', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:USA-Santa_Barbara-View_from_County_Courthouse_Tower-5.jpg' } },
  'uva': { color: '#232d4b', banner: 'uva.jpg', credit: { author: 'Quintin Soloviev', license: 'CC BY 4.0', url: 'https://commons.wikimedia.org/wiki/File:Charlottesville,_Virginia.jpg' } },
  'umich': { color: '#00274c', banner: 'umich.jpg', credit: { author: 'TheWxResearcher', license: 'CC BY 4.0', url: 'https://commons.wikimedia.org/wiki/File:Detroit_Skyline_August_2024.jpg' } },
  'unc': { color: '#9e8879', banner: 'unc.jpg', credit: { author: 'Abhiram Juvvadi', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Raleigh_Skyline.jpg' } },
  'uf': { color: '#83a3cb', banner: 'uf.jpg', credit: { author: 'Rbrko', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Gainesville,_FL_Downtown.jpg' } },
  'usc': { color: '#990000', banner: 'usc.jpg', credit: { author: 'Basil D Soufi (BDS2006)', license: 'CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:Downtown_Los_Angeles_Skyline.jpg' } },
  'nyu': { color: '#58078d', banner: 'nyu.jpg', credit: { author: 'King of Hearts', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Lower_Manhattan_from_Governors_Island_August_2017_panorama.jpg' } },
  'american': { color: '#004fa2', banner: 'american.jpg', credit: { author: 'Ad Meskens', license: 'CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:Washington_dc_skyline.jpg' } },
  'baylor': { color: '#5d5a3a', banner: 'baylor.jpg', credit: { author: 'Tony Webster', license: 'CC BY 2.0', url: 'https://commons.wikimedia.org/wiki/File:Downtown_Waco,_Texas_(47622943371).jpg' } },
  'binghamton': { color: '#005a43', banner: 'binghamton.jpg', credit: { author: 'Quintin Soloviev (Quintinsoloviev)', license: 'CC BY 4.0', url: 'https://commons.wikimedia.org/wiki/File:Binghamton,_New_York_skyline.jpg' } },
  'boston-university': { color: '#cc0000', banner: 'boston-university.jpg', credit: { author: 'King of Hearts', license: 'CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:Boston_skyline_from_Cambridge_March_2016_panorama_1.jpg' } },
  'brandeis': { color: '#003478', banner: 'brandeis.jpg', credit: { author: 'Nick Allen (Nickknack00)', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Brandeis_University_aerial_1.JPG' } },
  'buffalo': { color: '#005bbb', banner: 'buffalo.jpg', credit: { author: 'Quintin Soloviev', license: 'CC BY 4.0', url: 'https://commons.wikimedia.org/wiki/File:Buffalo,_NY_skyline.jpg' } },
  'case-western': { color: '#003071', banner: 'case-western.jpg', credit: { author: 'Erik Drost (retouched by ForestCityCle216)', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Cle_Skyline_April_2019.jpg' } },
  'clemson': { color: '#6c645b', banner: 'clemson.jpg', credit: { author: 'Spatms', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Greenville,_SC_Skyline_from_the_Main_Street_Bridge_over_Reedy_River.jpg' } },
  'drexel': { color: '#07294d', banner: 'drexel.jpg', credit: { author: 'Pierre Blaché', license: 'CC0 1.0', url: 'https://commons.wikimedia.org/wiki/File:Philadelphia_skyline_panorama.jpg' } },
  'fiu': { color: '#081e3f', banner: 'fiu.jpg', credit: { author: 'Denis Santana', license: 'CC BY-SA 2.0', url: 'https://commons.wikimedia.org/wiki/File:Downtown_Miami_skyline_from_PortMiami_2011_wide.jpg' } },
  'fsu': { color: '#782f40', banner: 'fsu.jpg', credit: { author: 'Urbantallahassee', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Tallahassee_Skyline_2023.jpg' } },
  'georgia-tech': { color: '#606a6b', banner: 'georgia-tech.jpg', credit: { author: 'Marc Merlin', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Panorama_of_the_Atlanta_skyline_viewed_from_the_Jackson_Street_Bridge,_June_2015.jpg' } },
  'gwu': { color: '#033c5a', banner: 'gwu.jpg', credit: { author: 'Washington Photo Safari', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Washington_DC_Skyline.jpg' } },
  'howard': { color: '#003a63', banner: 'howard.jpg', credit: { author: 'Ad Meskens', license: 'CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:Washington_dc_skyline.jpg' } },
  'indiana-bloomington': { color: '#990000', banner: 'indiana-bloomington.jpg', credit: { author: 'Momoneymoproblemz', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Panorama_of_downtown_Indianapolis_skyline,_looking_northeast.jpg' } },
  'lehigh': { color: '#502d0e', banner: 'lehigh.jpg', credit: { author: 'Tim Kiser (Malepheasant)', license: 'CC BY-SA 2.5', url: 'https://commons.wikimedia.org/wiki/File:Bethlehem_Pennsylvania_downtown.jpg' } },
  'marquette': { color: '#3e3435', banner: 'marquette.jpg', credit: { author: 'Michael Barera', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Milwaukee_June_2022_23_(skyline).jpg' } },
  'miami': { color: '#f47321', banner: 'miami.jpg', credit: { author: 'Marc Averette', license: 'CC0/Public Domain', url: 'https://commons.wikimedia.org/wiki/File:Miami_skyline_(1).jpg' } },
  'michigan-state': { color: '#c3d2ea', banner: 'michigan-state.jpg', credit: { author: 'Davidshane0', license: 'CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:Downtown_Lansing,_Michigan.jpg' } },
  'nc-state': { color: '#998779', banner: 'nc-state.jpg', credit: { author: 'Abhiram Juvvadi', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Raleigh_Skyline.jpg' } },
  'njit': { color: '#7c6c4c', banner: 'njit.jpg', credit: { author: 'King of Hearts', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Newark_October_2016_panorama.jpg' } },
  'northeastern': { color: '#c8102e', banner: 'northeastern.jpg', credit: { author: 'King of Hearts', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Boston_skyline_from_Longfellow_Bridge_September_2017_panorama_2.jpg' } },
  'ohio-state': { color: '#bb0000', banner: 'ohio-state.jpg', credit: { author: 'Paul Sableman (Flickr: pasa47)', license: 'CC BY 2.0', url: 'https://commons.wikimedia.org/wiki/File:Columbus_Skyline.jpg' } },
  'penn-state': { color: '#001e44', banner: 'penn-state.jpg', credit: { author: 'J. Passepartout', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Harrisburg_PA_skyline.jpg' } },
  'pepperdine': { color: '#1e2859', banner: 'pepperdine.jpg', credit: { author: 'Basil D Soufi (BDS2006)', license: 'CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:Downtown_Los_Angeles_Skyline.jpg' } },
  'pitt': { color: '#003594', banner: 'pitt.jpg', credit: { author: 'Dllu', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Pittsburgh_skyline_panorama_daytime.jpg' } },
  'purdue': { color: '#cfb991', banner: 'purdue.jpg', credit: { author: 'Prabhakar Koduri', license: 'CC BY 2.0', url: 'https://commons.wikimedia.org/wiki/File:Panoram_Indy.jpg' } },
  'rit': { color: '#8a7864', banner: 'rit.jpg', credit: { author: 'Andre Carrotflower', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Genesee_River_Panorama_from_Court_Street_Bridge,_Rochester,_New_York_-_20201017.jpg' } },
  'rochester': { color: '#a2a09d', banner: 'rochester.jpg', credit: { author: 'DanielPenfield', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:DowntownRochesterAtDawn.jpg' } },
  'rpi': { color: '#d6001c', banner: 'rpi.jpg', credit: { author: 'Antony-22', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Albany_skyline_2017.jpg' } },
  'santa-clara': { color: '#8c8e90', banner: 'santa-clara.jpg', credit: { author: 'XAtsukex', license: 'CC BY 3.0', url: 'https://commons.wikimedia.org/wiki/File:Panoramic_Downtown_San_Jose.jpg' } },
  'smu': { color: '#dbdcdd', banner: 'smu.jpg', credit: { author: 'IcedCowboyCoffee', license: 'CC0 1.0 (public domain)', url: 'https://commons.wikimedia.org/wiki/File:View_of_Dallas_skyline_overlooking_White_Rock_Lake_from_Boy_Scout_Hill.png' } },
  'stevens': { color: '#9d1535', banner: 'stevens.jpg', credit: { author: 'Kidfly182', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Manhattan_Skyline_from_Hoboken_010_(cropped).jpg' } },
  'stony-brook': { color: '#990000', banner: 'stony-brook.jpg', credit: { author: 'Norbert Nagel, Moerfelden-Walldorf, Germany (NorbertNagel)', license: 'CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:New_York_City_Skyline_Panoramic_01.jpg' } },
  'texas-am': { color: '#150c05', banner: 'texas-am.jpg', credit: { author: 'W0lfie', license: 'CC BY-SA 2.5', url: 'https://commons.wikimedia.org/wiki/File:Houston_skyline_from_southeast_at_night.jpg' } },
  'tulane': { color: '#dd95b1', banner: 'tulane.jpg', credit: { author: 'thepipe26 (Flickr)', license: 'CC BY 2.0', url: 'https://commons.wikimedia.org/wiki/File:New_Orleans_skyline-02.jpg' } },
  'uc-davis': { color: '#022851', banner: 'uc-davis.jpg', credit: { author: 'Justin Smith (J.smith)', license: 'CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:Sacramento_Skyline.jpg' } },
  'uc-irvine': { color: '#938562', banner: 'uc-irvine.jpg', credit: { author: 'Ken Lund', license: 'CC BY-SA 2.0', url: 'https://commons.wikimedia.org/wiki/File:Approaching_John_Wayne_International_Airport,_Santa_Ana,_California_(6575821593).jpg' } },
  'uc-merced': { color: '#002856', banner: 'uc-merced.jpg', credit: { author: 'JMora24', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Downtown_Fresno_Skyline.jpg' } },
  'uc-riverside': { color: '#757e85', banner: 'uc-riverside.jpg', credit: { author: 'Staticfish', license: 'CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:Riverside_Panorama.jpg' } },
  'uc-san-diego': { color: '#182b49', banner: 'uc-san-diego.jpg', credit: { author: 'Erin Asadourian (Thinker21)', license: 'CC BY 4.0', url: 'https://commons.wikimedia.org/wiki/File:Downtown_San_Diego_Skyline_from_Coronado.jpg' } },
  'uc-santa-cruz': { color: '#7f7d6b', banner: 'uc-santa-cruz.jpg', credit: { author: 'XAtsukex', license: 'CC BY 3.0', url: 'https://commons.wikimedia.org/wiki/File:Panoramic_Downtown_San_Jose.jpg' } },
  'uconn': { color: '#000e2f', banner: 'uconn.jpg', credit: { author: 'Quintin Soloviev', license: 'CC BY 4.0', url: 'https://commons.wikimedia.org/wiki/File:Hartford,_Connecticut_skyline.jpg' } },
  'uga': { color: '#ba0c2f', banner: 'uga.jpg', credit: { author: 'Marc Merlin', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Atlanta_skyline_from_Jackson_Street_Bridge_2020.jpg' } },
  'uic': { color: '#d50032', banner: 'uic.jpg', credit: { author: 'Wiknown77', license: 'CC0 1.0', url: 'https://commons.wikimedia.org/wiki/File:Downtown_Chicago_View_From_UIC_University_Hall.jpg' } },
  'uiuc': { color: '#6b585e', banner: 'uiuc.jpg', credit: { author: 'Peter Folk (uploaded by Rcbutcher)', license: 'CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:Champaign_From_Above.jpg' } },
  'umass-amherst': { color: '#881c1c', banner: 'umass-amherst.jpg', credit: { author: 'Quintin Soloviev', license: 'CC BY 4.0', url: 'https://commons.wikimedia.org/wiki/File:Springfield,_MA_city_skyline_2026.jpg' } },
  'usf': { color: '#9bac9a', banner: 'usf.jpg', credit: { author: 'Alvesgaspar', license: 'CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:Tampa_Florida_November_2013-3a.jpg' } },
  'ut-austin': { color: '#bf5700', banner: 'ut-austin.jpg', credit: { author: 'Larry D. Moore (Nv8200pa)', license: 'CC BY 4.0', url: 'https://commons.wikimedia.org/wiki/File:Austin_Skyline_from_the_Southeast_2022.jpg' } },
  'villanova': { color: '#002664', banner: 'villanova.jpg', credit: { author: 'Pierre Blaché', license: 'CC0 1.0', url: 'https://commons.wikimedia.org/wiki/File:Philadelphia_skyline_panorama.jpg' } },
  'virginia-tech': { color: '#423834', banner: 'virginia-tech.jpg', credit: { author: 'Joe Ravi', license: 'CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:Roanoke_City_(Virginia)_from_Mill_Mountain_Star_at_Dusk.jpg' } },
  'washington-seattle': { color: '#4b2e83', banner: 'washington-seattle.jpg', credit: { author: 'SounderBruce', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Seattle_skyline_from_Kerry_Park,_March_2019.jpg' } },
  'william-mary': { color: '#004e38', banner: 'william-mary.jpg', credit: { author: 'Jim (Flickr user 10673321@N06, via Wikimedia Commons)', license: 'CC BY-SA 2.0', url: 'https://commons.wikimedia.org/wiki/File:Skyline_of_Richmond,_Virginia.jpg' } },
  'wisconsin-madison': { color: '#c5050c', banner: 'wisconsin-madison.jpg', credit: { author: 'Monona98', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Madison_skyline_from_John_Nolen_Dr_-_May_2021.jpg' } },
  'wpi': { color: '#a6192e', banner: 'wpi.jpg', credit: { author: 'Anthonyt31201', license: 'CC0 1.0', url: 'https://commons.wikimedia.org/wiki/File:Worcester_Skyline,_November_2024.jpg' } },
  'asu': { color: '#6e6363', banner: 'asu.jpg', credit: { author: 'GuitarFreak', license: 'CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:Tempe_from_A_mountain.jpg' } },
  'chapman': { color: '#a97a8b', banner: 'chapman.jpg', credit: { author: 'Adoramassey', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Echo_Park_Lake_with_Downtown_Los_Angeles_Skyline.jpg' } },
  'clarkson': { color: '#0D433B', banner: 'clarkson.jpg', credit: { author: 'Óðinn', license: 'CC BY-SA 2.5 (Canada)', url: 'https://commons.wikimedia.org/wiki/File:Ottawa_skyline_panorama.jpg' } },
  'coloradoboulder': { color: '#6e7e21', banner: 'coloradoboulder.jpg', credit: { author: 'BUTTON74', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Denver_Long_Image.jpg' } },
  'colorado-state': { color: '#515f48', banner: 'colorado-state.jpg', credit: { author: 'Citycommunications', license: 'CC BY 3.0', url: 'https://commons.wikimedia.org/wiki/File:Downtown_Fort_Collins_Colorado.jpg' } },
  'creighton': { color: '#6a7972', banner: 'creighton.jpg', credit: { author: 'Hurstbergn', license: 'CC BY 4.0', url: 'https://commons.wikimedia.org/wiki/File:Panorama_of_Omaha,_Nebraska_and_Eppley_Airfield_from_Lewis_and_Clark_Monument_Park.jpg' } },
  'famu': { color: '#D44500', banner: 'famu.jpg', credit: { author: 'Urbantallahassee', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Tallahassee_Skyline_2023.jpg' } },
  'florida-atlantic': { color: '#003366', banner: 'florida-atlantic.jpg', credit: { author: 'Chaplin62', license: 'Public Domain', url: 'https://commons.wikimedia.org/wiki/File:DowntownBocaRatonSkyline.JPG' } },
  'iowa-state-science-tech': { color: '#d0ced7', banner: 'iowa-state-science-tech.jpg', credit: { author: 'Gage Skidmore', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Des_Moines_skyline_(55298344286).jpg' } },
  'kansas-state': { color: '#6d746d', banner: 'kansas-state.jpg', credit: { author: 'Dylan Edwards (Kswx29)', license: 'CC BY 3.0', url: 'https://commons.wikimedia.org/wiki/File:Topeka,_Kansas.JPG' } },
  'csulb': { color: '#7f6f68', banner: 'csulb.jpg', credit: { author: 'JD Lasica', license: 'CC BY 2.0', url: 'https://commons.wikimedia.org/wiki/File:Long-Beach-skyline-at-dusk_(21611595655).jpg' } },
  'csusb': { color: '#0065BD', banner: 'csusb.jpg', credit: { author: 'Atomicwarrior76', license: 'CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:SanBernardinoCA_Skyline.jpg' } },
  'montclair-state': { color: '#D1190D', banner: 'montclair-state.jpg', credit: { author: 'King of Hearts', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Lower_Manhattan_from_Jersey_City_September_2020_panorama.jpg' } },
  'oklahoma-state': { color: '#fe5c00', banner: 'oklahoma-state.jpg', credit: { author: 'Urbanative', license: 'CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:Skyline_of_Oklahoma_City_(cropped).jpg' } },
  'olemiss': { color: '#c8102e', banner: 'olemiss.jpg', credit: { author: 'Christopher Meredith (Flickr: chmeredith)', license: 'CC BY 2.0', url: 'https://commons.wikimedia.org/wiki/File:JacksonMS_Downtown_Panorama.jpg' } },
  'oregon-state': { color: '#d73f09', banner: 'oregon-state.jpg', credit: { author: 'McD22', license: 'CC BY 2.0', url: 'https://commons.wikimedia.org/wiki/File:Portland_Skyline_looking_South.jpg' } },
  'rowan': { color: '#57150B', banner: 'rowan.jpg', credit: { author: 'Abhiram Juvvadi', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Philadelphia_from_the_Delaware_River.jpg' } },
  'sdsu': { color: '#D41736', banner: 'sdsu.jpg', credit: { author: 'Agomga14', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:San_Diego_Skyline_desde_la_playa.jpg' } },
  'templeu': { color: '#9E1B34', banner: 'templeu.jpg', credit: { author: 'Mefman00', license: 'CC0 1.0', url: 'https://commons.wikimedia.org/wiki/File:Philadelphia_skyline_from_South_Street_Bridge.jpg' } },
  'tennessee-knoxville': { color: '#ff8200', banner: 'tennessee-knoxville.jpg', credit: { author: 'Nathan C. Fortner', license: 'CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:Knoxville_TN_skyline.jpg' } },
  'texaschristian': { color: '#a0a7af', banner: 'texaschristian.jpg', credit: { author: 'Adam Stanford (Adam76110)', license: 'CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:Fort_Worth_Skyline2.jpg' } },
  'ualabama': { color: '#7b7778', banner: 'ualabama.jpg', credit: { author: 'Tony Webster', license: 'CC BY-SA 2.0', url: 'https://commons.wikimedia.org/wiki/File:Birmingham_Skyline,_Alabama_(27864996195).jpg' } },
  'uarkansas': { color: '#f7f8e9', banner: 'uarkansas.jpg', credit: { author: 'Brandonrush', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Sunset_in_Fayetteville.jpg' } },
  'ucentralflorida': { color: '#74724e', banner: 'ucentralflorida.jpg', credit: { author: 'Quintin Soloviev', license: 'CC BY 4.0', url: 'https://commons.wikimedia.org/wiki/File:Orlando,_Florida_(cropped).jpg' } },
  'udenver': { color: '#a2706d', banner: 'udenver.jpg', credit: { author: 'Robert Kash', license: 'CC BY 2.0', url: 'https://commons.wikimedia.org/wiki/File:Sunrise_Over_Denver_Skyline.jpg' } },
  'ukentucky': { color: '#a4988a', banner: 'ukentucky.jpg', credit: { author: 'Fredgar', license: 'CC BY-SA 3.0 (also dual-licensed GFDL)', url: 'https://commons.wikimedia.org/wiki/File:Lexington_Downtown_Area_Panorama.jpg' } },
  'umbc': { color: '#fdb515', banner: 'umbc.jpg', credit: { author: 'Ṁ', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Baltimore_skyline.jpg' } },
  'unevada-reno': { color: '#041E42', banner: 'unevada-reno.jpg', credit: { author: 'Yelderberry', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Skyline_of_Reno,_Nevada_2024-10-13_1.jpg' } },
  'usandiego': { color: '#002868', banner: 'usandiego.jpg', credit: { author: 'ewen and donabel', license: 'CC BY 2.0', url: 'https://commons.wikimedia.org/wiki/File:SanDiegoSkyline.jpg' } },
  'ut-dallas': { color: '#e87500', banner: 'ut-dallas.jpg', credit: { author: 'Matthew T Rader', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Dallas_Skyline_at_Dusk.jpg' } },
  'uvermont': { color: '#154734', banner: 'uvermont.jpg', credit: { author: 'Patrick Spencer', license: 'CC BY-SA 2.0', url: 'https://commons.wikimedia.org/wiki/File:Burlington_from_Lake_Champlain.jpg' } },
  'washington-stateu': { color: '#981e32', banner: 'washington-stateu.jpg', credit: { author: 'Spicypepper999', license: 'CC0 1.0', url: 'https://commons.wikimedia.org/wiki/File:Pullman_WSU_Campus,_January_2024.jpg' } },
  'boston-college': { color: '#98002E', banner: 'boston-college.jpg', credit: { author: 'King of Hearts', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Boston_skyline_from_Longfellow_Bridge_September_2017_panorama_2.jpg' } },
  'bradley': { color: '#e11837', banner: 'bradley.jpg', credit: { author: 'Scott Tranchitella', license: 'CC BY-SA 2.0', url: 'https://commons.wikimedia.org/wiki/File:Peoria_Illinois_Skyline.jpg' } },
  'clark': { color: '#ee2e24', banner: 'clark.jpg', credit: { author: 'Anthonyt31201', license: 'CC0 1.0', url: 'https://commons.wikimedia.org/wiki/File:Worcester_Skyline,_November_2024.jpg' } },
  'east-carolina': { color: '#706d6d', banner: 'east-carolina.jpg', credit: { author: 'Josh Hunter', license: 'CC BY 3.0', url: 'https://commons.wikimedia.org/wiki/File:Cloudless_Midday_Downtown_Raleigh_Skyline_(185876191).jpeg' } },
  'fairfield': { color: '#80a7b1', banner: 'fairfield.jpg', credit: { author: 'Lima16', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Bridgeport_Skyline_from_Route_8.jpg' } },
  'hofstra': { color: '#0B1E73', banner: 'hofstra.jpg', credit: { author: 'King of Hearts', license: 'CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:Lower_Manhattan_from_Jersey_City_November_2014_panorama_2.jpg' } },
  'suny-albany': { color: '#8491a6', banner: 'suny-albany.jpg', credit: { author: 'UpstateNYer', license: 'CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:AlbanyNYPano.jpg' } },
  'udelaware': { color: '#00539f', banner: 'udelaware.jpg', credit: { author: 'Tim Kiser (User:Malepheasant)', license: 'CC BY-SA 2.5', url: 'https://commons.wikimedia.org/wiki/File:Wilmington_Delaware_skyline.jpg' } },
  'ukansas': { color: '#8d806e', banner: 'ukansas.jpg', credit: { author: 'Bhall87', license: 'CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:KU_Skyline.JPG' } },
  'ulouisville': { color: '#AD0000', banner: 'ulouisville.jpg', credit: { author: 'Charles Delano / LouisvilleUSACE (US Army Corps of Engineers, Louisville District)', license: 'CC BY 2.0', url: 'https://commons.wikimedia.org/wiki/File:Louisville,_Kentucky_skyline_at_night_(2021).jpg' } },
  'umass-lowell': { color: '#0067B1', banner: 'umass-lowell.jpg', credit: { author: 'Matthew Dwyer (Mattyd820)', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:The_Mill_City_at_Twilight.jpg' } },
  'unc-wilmington': { color: '#007680', banner: 'unc-wilmington.jpg', credit: { author: 'DiscoA340', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Downtown_Wilmington_Skyline_(July_2023)_02.jpg' } },
  'uofiowa': { color: '#FFCD00', banner: 'uofiowa.jpg', credit: { author: 'American007', license: 'Public domain (released by copyright holder)', url: 'https://commons.wikimedia.org/wiki/File:Iowa_City_south_skyline.jpg' } },
  'uofminnesota-twin-cities': { color: '#7a0019', banner: 'uofminnesota-twin-cities.jpg', credit: { author: 'Guywelch2000', license: 'CC BY 4.0', url: 'https://commons.wikimedia.org/wiki/File:Downtown_Minneapolis_skyline_across_the_Mississippi_River.jpg' } },
  'uoklahoma': { color: '#841617', banner: 'uoklahoma.jpg', credit: { author: 'Kerwin Moore (uploaded by Urbanative)', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Oklahoma_City_downtown_skyline_May_2024.jpg' } },
  'usanfrancisco': { color: '#8a897d', banner: 'usanfrancisco.jpg', credit: { author: 'Adam Podstawczynski (Podstawko)', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:San_Francisco_at_dusk.jpg' } },
  'virginiacommonwealth': { color: '#7c8c99', banner: 'virginiacommonwealth.jpg', credit: { author: 'Bruce Emmerling', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:A_view_of_downtown_Richmond_2_(cropped).jpg' } },
  'illinois-tech': { color: '#CC0000', banner: 'illinois-tech.jpg', credit: { author: 'Buphoff', license: 'CC BY-SA 3.0 (also dual-licensed 2.5/2.0/1.0)', url: 'https://commons.wikimedia.org/wiki/File:Chicago_Skyline_Hi-Res.jpg' } },
  'mizzou': { color: '#7a5453', banner: 'mizzou.jpg', credit: { author: 'csch15', license: 'CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:Columbia-mo-skyline.jpg' } },
  'quinnipiac': { color: '#0C2340', banner: 'quinnipiac.jpg', credit: { author: 'versageek', license: 'CC BY-SA 2.0', url: 'https://commons.wikimedia.org/wiki/File:New_Haven_Skyline_Panorama_from_Mid-Harbor_(4807508238).jpg' } },
  'rutgers-camden': { color: '#cc0033', banner: 'rutgers-camden.jpg', credit: { author: 'Parent5446', license: 'CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:Philadelphia_Panorama_From_Camden.JPG' } },
  'rutgers-newark': { color: '#cc0033', banner: 'rutgers-newark.jpg', credit: { author: 'King of Hearts', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Newark_October_2016_panorama.jpg' } },
  'stockton': { color: '#0d6bad', banner: 'stockton.jpg', credit: { author: 'R\'lyeh Imaging (Anthony Finan)', license: 'CC BY 2.0', url: 'https://commons.wikimedia.org/wiki/File:Atlantic_City,_NJ_(8605350304).jpg' } },
  'colorado-school-of-mines': { color: '#21314D', banner: 'colorado-school-of-mines.jpg', credit: { author: 'Xnatedawgx', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Denver_skyline_from_Speer_Blvd_near_I-25,_April_2019.jpg' } },
  'saintlouisu': { color: '#00244D', banner: 'saintlouisu.jpg', credit: { author: 'Daniel Schwen', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:St_Louis_night_expblend.jpg' } },
  'duquesne': { color: '#8690a3', banner: 'duquesne.jpg', credit: { author: 'Dllu', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Pittsburgh_skyline_panorama_daytime.jpg' } },
  'udayton': { color: '#004B8D', banner: 'udayton.jpg', credit: { author: 'Blervis', license: 'CC BY 4.0', url: 'https://commons.wikimedia.org/wiki/File:Dayton_Skyline_-_Sunset_September_2022.jpg' } },
  'uidaho': { color: '#F1B300', banner: 'uidaho.jpg', credit: { author: 'Lucasreynolds16', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Spokane_Skyline_2024.jpg' } },
  'unewhampshire': { color: '#606350', banner: 'unewhampshire.jpg', credit: { author: 'Quintin Soloviev', license: 'CC BY 4.0', url: 'https://commons.wikimedia.org/wiki/File:Skyline_of_Manchester,_New_Hampshire,_USA.jpg' } },
  'uoregon': { color: '#d1d9eb', banner: 'uoregon.jpg', credit: { author: 'Jsayre64', license: 'CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:Eugene_skyline_crop.jpg' } },
  'upacific': { color: '#D86018', banner: 'upacific.jpg', credit: { author: 'Quintin Soloviev (Quintinsoloviev)', license: 'CC BY 4.0', url: 'https://commons.wikimedia.org/wiki/File:Aerial_view_of_Stockton,_California_skyline.jpg' } },
  'urhodeisland': { color: '#002147', banner: 'urhodeisland.jpg', credit: { author: 'Kenneth C. Zirkel', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Providence_Rhode_Island_skyline_2017.jpg' } },
  'uutah': { color: '#cc0000', banner: 'uutah.jpg', credit: { author: 'Garrett (from Salt Lake City)', license: 'CC BY 2.0', url: 'https://commons.wikimedia.org/wiki/File:Salt_Lake_City_skyline_banner.jpg' } },
  'valparaiso': { color: '#381e0e', banner: 'valparaiso.jpg', credit: { author: 'Marcin Klapczynski', license: 'CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:Chicago_Downtown_Panorama.jpg' } },
  'wayne-state': { color: '#0c5449', banner: 'wayne-state.jpg', credit: { author: 'TheWxResearcher', license: 'CC0 1.0', url: 'https://commons.wikimedia.org/wiki/File:Detroit_Skyline_from_Windsor_2025-09-01.jpg' } },
  'csufullerton': { color: '#00244E', banner: 'csufullerton.jpg', credit: { author: 'Alek Leckszas (AlekVT)', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Los_Angeles_with_Mount_Baldy.jpg' } },
  'elon': { color: '#73000a', banner: 'elon.jpg', credit: { author: 'Mx. Granger', license: 'CC0 1.0', url: 'https://commons.wikimedia.org/wiki/File:Greensboro_skyline_from_the_Depot.jpg' } },
  'georgia-state': { color: '#0039a6', banner: 'georgia-state.jpg', credit: { author: 'Marc Merlin', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Atlanta_skyline_from_Jackson_Street_Bridge_2020.jpg' } },
  'michigan-tech': { color: '#9195a2', banner: 'michigan-tech.jpg', credit: { author: 'August Schwerdfeger', license: 'CC BY 2.0', url: 'https://commons.wikimedia.org/wiki/File:Duluth,_Minnesota_(2017).jpg' } },
  'missourri-s&t': { color: '#6e7a65', banner: 'missourri-s&t.jpg', credit: { author: 'Panini!', license: 'CC0 1.0 (public domain)', url: 'https://commons.wikimedia.org/wiki/File:Downtown_St._Louis_from_the_Gateway_Arch_Overlook.png' } },
  'north-carolina-charolette': { color: '#9b9fa3', banner: 'north-carolina-charolette.jpg', credit: { author: 'Louis Waweru', license: 'Public domain (CC0-equivalent, author-dedicated)', url: 'https://commons.wikimedia.org/wiki/File:Panorama_of_Charlotte,_North_Carolina,_seen_from_Hearn_and_Graham_facing_east_(2005).jpg' } },
  'uhouston': { color: '#c8102e', banner: 'uhouston.jpg', credit: { author: 'Henry Han (Hequals2henry)', license: 'CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:Panoramic_Houston_skyline.jpg' } },
  'university-maryland-college-park': { color: '#CE1126', banner: 'university-maryland-college-park.jpg', credit: { author: 'Ad Meskens', license: 'CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:Washington_dc_skyline.jpg' } },
  'miamiu': { color: '#62584f', banner: 'miamiu.jpg', credit: { author: 'Pack489', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Downtown_Cincinnati,_Ohio,_USA_Panorama_Taken_from_Covington_(cropped).jpg' } },
  'thomas-jefferson': { color: '#1A2650', banner: 'thomas-jefferson.jpg', credit: { author: '颐园居', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Philadelphia_skyline_20240528.jpg' } },
  'unebraska-lincoln': { color: '#E41C38', banner: 'unebraska-lincoln.jpg', credit: { author: 'Hanyou23', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Skyline_of_Downtown_Lincoln,_Nebraska,_USA_(2024).jpg' } },
  'yeshiva': { color: '#035596', banner: 'yeshiva.jpg', credit: { author: 'King of Hearts', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Lower_Manhattan_from_Jersey_City_September_2020_panorama.jpg' } },
  'amherst': { color: '#3f1f69', banner: 'amherst.jpg', credit: { author: 'Quintin Soloviev (Quintinsoloviev)', license: 'CC BY 4.0', url: 'https://commons.wikimedia.org/wiki/File:Amherst,_MA_(cropped).jpg' } },
  'barnard': { color: '#002F6C', banner: 'barnard.jpg', credit: { author: 'Norbert Nagel, Fotograf, Mörfelden-Walldorf, Germany', license: 'CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:New_York_City_Skyline_Panoramic_01.jpg' } },
  'bowdoin': { color: '#827d7f', banner: 'bowdoin.jpg', credit: { author: 'Bd2media', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Portland_waterfront_and_skyline.jpg' } },
  'carleton': { color: '#173a79', banner: 'carleton.jpg', credit: { author: 'Guywelch2000', license: 'CC BY 4.0', url: 'https://commons.wikimedia.org/wiki/File:Downtown_Minneapolis_skyline_across_the_Mississippi_River.jpg' } },
  'claremont-mckenna': { color: '#60001E', banner: 'claremont-mckenna.jpg', credit: { author: 'Carol M. Highsmith', license: 'Public domain (PD-Highsmith)', url: 'https://commons.wikimedia.org/wiki/File:Skyline_view_of_Los_Angeles,_California_LCCN2013631687.tif' } },
  'davidson': { color: '#2a3615', banner: 'davidson.jpg', credit: { author: 'Precisionviews (original); perspective/colour correction by Cmao20', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Uptown_Charlotte_2018_taking_by_DJI_Phantom_4_pro_-_Perspective_Corrected_Edit.jpg' } },
  'hamilton': { color: '#002f86', banner: 'hamilton.jpg', credit: { author: 'Quintin Soloviev', license: 'CC BY 4.0', url: 'https://commons.wikimedia.org/wiki/File:Utica,_New_York_skyline.jpg' } },
  'harvey-mudd': { color: '#fdb913', banner: 'harvey-mudd.jpg', credit: { author: 'Basil D Soufi (BDS2006)', license: 'CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:Downtown_Los_Angeles_Skyline.jpg' } },
  'pomona': { color: '#005499', banner: 'pomona.jpg', credit: { author: 'Basil D Soufi (BDS2006)', license: 'CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:Downtown_Los_Angeles_Skyline.jpg' } },
  'swarthmore': { color: '#84000D', banner: 'swarthmore.jpg', credit: { author: 'Andrew Gnias (AGnias47)', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Philadelphia_Skyline_from_Spring_Garden_Bridge.jpg' } },
  'urichmond': { color: '#990000', banner: 'urichmond.jpg', credit: { author: 'Jim (Flickr user 10673321@N06)', license: 'CC BY-SA 2.0', url: 'https://commons.wikimedia.org/wiki/File:Skyline_of_Richmond,_Virginia.jpg' } },
  'vassar': { color: '#81878a', banner: 'vassar.jpg', credit: { author: 'Daniel Case', license: 'CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:Poughkeepsie_from_across_Hudson_River.jpg' } },
  'washington-and-lee': { color: '#676361', banner: 'washington-and-lee.jpg', credit: { author: 'Ben Schumin (SchuminWeb)', license: 'CC BY-SA 2.0', url: 'https://commons.wikimedia.org/wiki/File:Roanoke_from_the_star,_March_2003.jpg' } },
  'wellesley': { color: '#57546a', banner: 'wellesley.jpg', credit: { author: 'King of Hearts', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Boston_skyline_from_East_Boston_November_2016_panorama_1.jpg' } },
  'williams': { color: '#8c9ba2', banner: 'williams.jpg', credit: { author: 'UpstateNYer', license: 'CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:Albany_Panorama.jpg' } },
  'wesleyan': { color: '#5b5959', banner: 'wesleyan.jpg', credit: { author: 'Paul Danese', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:20241126_hartford_skyline_from_south_meadows_PD205232.jpg' } },
  'grinnell': { color: '#DA291C', banner: 'grinnell.jpg', credit: { author: 'Gage Skidmore', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Des_Moines_skyline_(55298344286).jpg' } },
  'usma-west-point': { color: '#000000', banner: 'usma-west-point.jpg', credit: { author: 'Juliancolton', license: 'Public domain (PD-self)', url: 'https://commons.wikimedia.org/wiki/File:West_Point_US_9W_panorama.jpg' } },
  'auburn': { color: '#7d7976', banner: 'auburn.jpg', credit: { author: 'AuburnPilot', license: 'PD-self (public domain)', url: 'https://commons.wikimedia.org/wiki/File:AuburnALAbove.jpg' } },
  'loyola-marymount': { color: '#80777a', banner: 'loyola-marymount.jpg', credit: { author: 'Basil D Soufi (BDS2006)', license: 'CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:Downtown_Los_Angeles_Skyline.jpg' } },
  'suny-esf': { color: '#a8aea7', banner: 'suny-esf.jpg', credit: { author: 'Gizzakk at English Wikipedia', license: 'CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:Syracuse_skyline.jpg' } },
  'depaul': { color: '#6c675d', banner: 'depaul.jpg', credit: { author: 'Pedro Szekely', license: 'CC BY-SA 2.0', url: 'https://commons.wikimedia.org/wiki/File:Chicago_Skyline_(44713240565).jpg' } },
};

// Logos live at images/logos/<slug>.png. A few schools have none yet; the
// onerror hook hides the broken <img> rather than showing a torn-image icon.
const logoSrc = slug => `/images/logos/${slug}.png`;
const LOGO_ONERR = "this.style.display='none'";

// ── Favorites & History ────────────────────────────────────────────────

const FAV_KEY     = 'cds_favorites';
const HISTORY_KEY = 'cds_recently_viewed';

function getFavs()     { return new Set(JSON.parse(localStorage.getItem(FAV_KEY) ?? '[]')); }
function saveFavs(set) { localStorage.setItem(FAV_KEY, JSON.stringify([...set])); }

function renderFavoritesBox(allSchools) {
  const slugs = [...getFavs()];
  const box = document.getElementById('school-fav-box');
  if (!box) return;
  if (!slugs.length) { box.style.display = 'none'; return; }
  box.style.display = '';
  document.getElementById('school-fav-list').innerHTML = slugs.map(sl => {
    const school = allSchools.find(s => s.slug === sl);
    if (!school) return '';
    return `<a class="history-item" href="/schools/${sl}/">
      <img class="history-logo" src="${logoSrc(sl)}" alt="" onerror="${LOGO_ONERR}">
      <span class="history-name">${school.name}</span>
    </a>`;
  }).filter(Boolean).join('');
}

function renderHistoryBox(allSchools) {
  const slugs = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]');
  const box = document.getElementById('school-history-box');
  if (!box) return;
  if (!slugs.length) { box.style.display = 'none'; return; }
  box.style.display = '';
  document.getElementById('school-history-list').innerHTML = slugs.map(sl => {
    const school = allSchools.find(s => s.slug === sl);
    if (!school) return '';
    return `<a class="history-item" href="/schools/${sl}/">
      <img class="history-logo" src="${logoSrc(sl)}" alt="" onerror="${LOGO_ONERR}">
      <span class="history-name">${school.name}</span>
    </a>`;
  }).filter(Boolean).join('');
}

// ── Helpers ────────────────────────────────────────────────────────────

function fmt(val, type) {
  if (val == null) return '<span class="stat-na">n/a</span>';
  if (type === 'money') return '$' + Number(val).toLocaleString();
  if (type === 'pct')   return (val * 100).toFixed(1) + '%';
  return val;
}

function tableHtml(headers, rows) {
  const th = headers.map(h => `<th>${h}</th>`).join('');
  const tbody = rows.map(r =>
    `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`
  ).join('');
  return `<div class="tbl-wrap"><table class="tbl"><thead><tr>${th}</tr></thead><tbody>${tbody}</tbody></table></div>`;
}

function scoreBarHtml(label, val25, val75, scaleMin, scaleMax) {
  if (val25 == null || val75 == null) {
    return `<div class="score-row">
      <div class="score-row-label">${label}</div>
      <span class="score-na-text">Not reported</span>
    </div>`;
  }
  const left  = ((val25 - scaleMin) / (scaleMax - scaleMin) * 100).toFixed(1);
  const width = ((val75  - val25)   / (scaleMax - scaleMin) * 100).toFixed(1);
  return `<div class="score-row">
    <div class="score-row-label">${label}</div>
    <div class="score-bar-wrap">
      <div class="score-bar-track">
        <div class="score-bar-fill" style="left:${left}%;width:${width}%"></div>
      </div>
      <div class="score-bar-vals">${val25} – ${val75}</div>
    </div>
  </div>`;
}

function demoBarHtml(label, val) {
  if (val == null) return '';
  const pct = (val * 100);
  const barWidth = Math.max(pct, 0.3).toFixed(1);
  return `<div class="demo-bar-row">
    <div class="demo-bar-label">${label}</div>
    <div class="demo-bar-track"><div class="demo-bar-fill" style="width:${barWidth}%"></div></div>
    <div class="demo-bar-pct">${pct.toFixed(1)}%</div>
  </div>`;
}

// ── Render: Hero ────────────────────────────────────────────────────────
// Just the photo/gradient strip — see renderHeroPill for the floating
// name/location/site card and renderQuickFacts for the stats below it.

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

function renderHero(s, slug, meta) {
  const bannerStyle = meta.banner
    ? `background:linear-gradient(180deg, rgba(0,0,0,0.1), rgba(0,0,0,0.4)), url('/images/banners/${meta.banner}');background-size:cover;background-position:center;background-repeat:no-repeat`
    : `background:linear-gradient(135deg,${meta.color},#000)`;
  // Required attribution for the CC-licensed campus photos sourced from
  // Wikimedia Commons/Flickr — links back to the source file page.
  const credit = meta.credit
    ? `<a class="hero-credit" href="${meta.credit.url}" target="_blank" rel="noopener">Photo: ${escapeHtml(meta.credit.author)} · ${escapeHtml(meta.credit.license)}</a>`
    : '';
  return `<div class="school-hero" style="${bannerStyle}">${credit}</div>`;
}

// ── Render: Floating hero pill (name/location/site + a large logo) ─────

function renderHeroPill(s, slug, meta) {
  const logo = `<img class="hero-logo" src="${logoSrc(slug)}" alt="${s.name}" onerror="${LOGO_ONERR}">`;
  const metaParts = [s.location, s.school_type].filter(Boolean);
  const siteLink = s.website
    ? ` · <a class="hero-site-link" href="${/^https?:\/\//.test(s.website) ? '' : 'https://'}${s.website}" target="_blank" rel="noopener">Official Site →</a>`
    : '';

  return `
    <div class="hero-pill">
      ${logo}
      <div class="hero-text">
        <h1 class="hero-name">
          ${s.name}
          <button class="fav-btn hero-fav-btn${getFavs().has(slug) ? ' favorited' : ''}" id="hero-fav-btn" title="${getFavs().has(slug) ? 'Remove from favorites' : 'Add to favorites'}">
            <svg viewBox="0 0 24 24"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>
          </button>
        </h1>
        <p class="hero-meta">${metaParts.join(' · ')}${siteLink}</p>
      </div>
    </div>`;
}

// ── Render: Year bar (switcher + missing-data notice) ──────────────────
// Sits below the hero pill, ahead of any actual data (.quick-facts-strip
// and the section grid) — not part of the title card itself, since it's
// metadata about the data rather than about the school.

// yearCtx: { currentYearKey, availableYearKeys, latestAvailableKey }
function renderYearBar(yearCtx) {
  const { currentYearKey, availableYearKeys, latestAvailableKey } = yearCtx;
  const isCurrentTheLatestAvailable = currentYearKey === latestAvailableKey;
  const label = isCurrentTheLatestAvailable ? 'Currently showing most recent year' : 'Currently showing';
  // Newest first in the menu, like the homepage's year dropdown.
  const yearMenu = [...availableYearKeys].reverse().map(k =>
    `<button type="button" class="sort-option${k === currentYearKey ? ' active' : ''}" data-year="${k}">${shortYearLabel(k)}</button>`
  ).join('');

  const missingNotice = latestAvailableKey !== SITE_LATEST_YEAR_KEY
    ? `<p class="year-missing-notice">Notice, this school is missing CDS data for the most recent year. Displaying the most recent available data: ${shortYearLabel(latestAvailableKey)}.</p>`
    : '';

  // Always shown (not just when there's a missing-year notice or a choice
  // of years to switch between) — a visitor should always be able to see
  // at a glance which year's data they're looking at. The dropdown itself
  // only renders as interactive when there's actually more than one year
  // to pick from; otherwise it's plain text so it doesn't look clickable.
  return `<div class="hero-year-bar">
      ${availableYearKeys.length > 1 ? `
      <div class="year-switcher" id="year-switcher">
        <button class="year-switcher-btn" id="year-switcher-btn" type="button">
          <span>${label}: <strong>${shortYearLabel(currentYearKey)}</strong></span>
          <svg class="sort-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        <div class="year-switcher-menu" id="year-switcher-menu">${yearMenu}</div>
      </div>` : `
      <div class="year-switcher-btn" style="cursor:default;background:none;border:none;padding:4px 0;">
        <span>${label}: <strong>${shortYearLabel(currentYearKey)}</strong></span>
      </div>`}
      ${missingNotice}
    </div>`;
}

// ── Render: Quick facts strip (flat bar below the pill) ─────────────────

function renderQuickFacts(s) {
  const satVal   = s.sat_composite_25 != null && s.sat_composite_75 != null
    ? `${s.sat_composite_25}–${s.sat_composite_75}`
    : '<span class="stat-na">n/a</span>';

  const act25 = s.act_composite_25;
  const act75 = s.act_composite_75;

  const tuitionOOS = s.tuition_out_of_state ?? s.tuition;

  const chips = [
    ['Acceptance Rate', s.acceptance_rate != null ? (s.acceptance_rate * 100).toFixed(1) + '%' : '<span class="stat-na">n/a</span>'],
    ['SAT Range',       satVal],
    ['ACT Range',       act25 != null && act75 != null ? `${act25}–${act75}` : '<span class="stat-na">n/a</span>'],
    ['Avg GPA (W)',     s.avg_gpa_weighted != null ? parseFloat(s.avg_gpa_weighted).toFixed(2) : 'Not reported'],
    ['Undergrads',      s.total_undergrads != null ? s.total_undergrads.toLocaleString() : '<span class="stat-na">n/a</span>'],
    ['Tuition (OOS)',   tuitionOOS != null ? '$' + tuitionOOS.toLocaleString() : '<span class="stat-na">n/a</span>'],
  ];
  return chips.map((c, i) =>
    (i > 0 ? '<div class="stat-divider"></div>' : '') +
    `<div class="stat-chip">
      <div class="stat-chip-val">${c[1]}</div>
      <div class="stat-chip-label">${c[0]}</div>
    </div>`
  ).join('');
}

// ── Render: Admissions summary (paired side-by-side with Cost) ─────────

function renderAdmissionsSummary(s) {
  function kv(label, val) {
    return `<div class="kv-label">${label}</div><div class="kv-val">${val ?? '<span class="stat-na">n/a</span>'}</div>`;
  }

  const kvGrid = `<div class="kv-grid">
    ${kv('Location',                  s.location)}
    ${kv('School Type',               s.school_type)}
    ${kv('Early Action / Decision',   s.ea_ed_type)}
    ${kv('EA/ED Deadline',            s.ea_ed_deadline)}
    ${kv('Regular Decision Deadline', s.rd_deadline)}
    ${kv('Application Fee',           s.application_fee != null ? '$' + s.application_fee : null)}
  </div>`;

  return `
    <section class="school-section">
      <h2 class="section-title">Admissions</h2>
      ${kvGrid}
    </section>`;
}

// ── Render: Selectivity (funnel + admit rates by round and by gender) ───

function renderSelectivitySection(s) {
  const ratePct = s.acceptance_rate != null ? (s.acceptance_rate * 100).toFixed(1) + '%' : null;
  const funnel = `<div class="funnel">
    <div class="funnel-step">
      <div class="funnel-val">${s.applicants_total != null ? s.applicants_total.toLocaleString() : '<span class="stat-na">n/a</span>'}</div>
      <div class="funnel-label">Applied</div>
    </div>
    <div class="funnel-arrow">→</div>
    <div class="funnel-step">
      <div class="funnel-val">${s.admitted_total != null ? s.admitted_total.toLocaleString() : '<span class="stat-na">n/a</span>'}</div>
      <div class="funnel-label">Admitted</div>
      ${ratePct ? `<div class="funnel-pct">${ratePct} rate</div>` : ''}
    </div>
    <div class="funnel-arrow">→</div>
    <div class="funnel-step">
      <div class="funnel-val">${s.enrolled_total != null ? s.enrolled_total.toLocaleString() : '<span class="stat-na">n/a</span>'}</div>
      <div class="funnel-label">Enrolled</div>
    </div>
  </div>`;

  let poolsHtml = '<p class="no-data">Data not yet available.</p>';
  if (s.applicant_pools) {
    const p = s.applicant_pools;
    poolsHtml = tableHtml(
      ['Round', 'Applied', 'Accepted', 'Rate'],
      [
        ['Early Action / Decision', fmt(p.ea?.applied), fmt(p.ea?.admitted ?? p.ea?.accepted),
          p.ea?.rate != null ? (p.ea.rate * 100).toFixed(1) + '%' : '<span class="stat-na">n/a</span>'],
        ['Regular Decision', fmt(p.rd?.applied), fmt(p.rd?.admitted ?? p.rd?.accepted),
          p.rd?.rate != null ? (p.rd.rate * 100).toFixed(1) + '%' : '<span class="stat-na">n/a</span>'],
        ['Waitlist Offered / Accepted', fmt(p.waitlist?.offered), fmt(p.waitlist?.accepted_spots), '<span class="stat-na">n/a</span>'],
      ]
    );
  }

  let genderRoundsHtml = '<p class="no-data">Data not yet available.</p>';
  if (s.gender_breakdown) {
    const g = s.gender_breakdown;
    genderRoundsHtml = tableHtml(
      ['', 'Applied', 'Accepted', 'Enrolled'],
      [
        ['Male',   fmt(g.applied?.male),   fmt(g.accepted?.male),   fmt(g.enrolled?.male)],
        ['Female', fmt(g.applied?.female), fmt(g.accepted?.female), fmt(g.enrolled?.female)],
      ]
    );
  }

  return `
    <section class="school-section">
      <h2 class="section-title">Selectivity</h2>
      ${funnel}
      <div class="cols-2">
        <div>
          <h3 class="subsection-title">By Round (EA vs RD)</h3>
          ${poolsHtml}
        </div>
        <div>
          <h3 class="subsection-title">By Gender</h3>
          ${genderRoundsHtml}
        </div>
      </div>
    </section>`;
}

// ── Render: Academic Profile (test score ranges + GPA distribution) ─────

function renderAcademicProfileSection(s) {
  let submissionHtml = '';
  if (s.sat_act_breakdown) {
    const b = s.sat_act_breakdown;
    submissionHtml = `
      <h3 class="subsection-title">Score Submission (Enrolled)</h3>
      ${tableHtml(
        ['Test', 'Submitted', '% of Enrolled'],
        [
          ['SAT', b.sat_submitted_count != null ? b.sat_submitted_count.toLocaleString() : '<span class="stat-na">n/a</span>', b.sat_submitted_pct != null ? (b.sat_submitted_pct * 100).toFixed(0) + '%' : '<span class="stat-na">n/a</span>'],
          ['ACT', b.act_submitted_count != null ? b.act_submitted_count.toLocaleString() : '<span class="stat-na">n/a</span>', b.act_submitted_pct != null ? (b.act_submitted_pct * 100).toFixed(0) + '%' : '<span class="stat-na">n/a</span>'],
        ]
      )}`;
  }

  const scoresCol = `
    <div>
      <h3 class="subsection-title">SAT — 25th to 75th Percentile</h3>
      <div class="score-rows">
        ${scoreBarHtml('Composite', s.sat_composite_25, s.sat_composite_75, 400, 1600)}
        ${scoreBarHtml('Reading &amp; Writing', s.sat_reading_25, s.sat_reading_75, 200, 800)}
        ${scoreBarHtml('Math', s.sat_math_25, s.sat_math_75, 200, 800)}
      </div>
      <h3 class="subsection-title">ACT — 25th to 75th Percentile</h3>
      <div class="score-rows">
        ${scoreBarHtml('Composite', s.act_composite_25, s.act_composite_75, 1, 36)}
        ${scoreBarHtml('Math', s.act_math_25, s.act_math_75, 1, 36)}
        ${scoreBarHtml('English', s.act_english_25, s.act_english_75, 1, 36)}
      </div>
      ${submissionHtml}
    </div>`;

  let gpaCol = `
    <div>
      <h3 class="subsection-title">GPA Distribution of Enrolled Students</h3>
      <p class="no-data">Data not yet available.</p>
    </div>`;
  const g = normalizeGpaDistribution(s.gpa_distribution);
  if (g) {
    const rows = GPA_BUCKETS.slice().reverse().map(([key, label]) =>
      [label, g[key] != null ? (g[key] * 100).toFixed(0) + '%' : '<span class="stat-na">n/a</span>']);
    const gpaDistHtml = tableHtml(['GPA Range', '% of Enrolled'], rows);

    const chartPoints = GPA_BUCKETS
      .map(([key, label]) => ({ label, value: g[key] }))
      .filter(p => p.value != null);

    const chartBlock = chartPoints.length >= 2
      ? `<div class="gpa-chart-wrap"><canvas id="gpa-chart"></canvas></div>
         <p class="chart-caption">GPA bands aren't evenly sized (the top band is a single value, 4.0, while others span up to a full point), and schools often don't report bands below 3.0 — read this as a shape, not a precise curve.</p>`
      : '';

    gpaCol = `
      <div>
        <h3 class="subsection-title">GPA Distribution of Enrolled Students</h3>
        ${chartBlock}
        ${gpaDistHtml}
      </div>`;
  }

  return `
    <section class="school-section">
      <h2 class="section-title">Academic Profile</h2>
      <div class="cols-2">
        ${scoresCol}
        ${gpaCol}
      </div>
    </section>`;
}

// ── Render: Class Rank (chart, when the school reports it) ──────────────

function renderClassRankSection(s) {
  const cr = s.class_rank;
  const segments = classRankSegments(cr);

  if (!segments) {
    return `
      <section class="school-section">
        <h2 class="section-title">Class Rank of Enrolled Students</h2>
        <p class="no-data">Not reported in CDS — many high schools no longer calculate class rank.</p>
      </section>`;
  }

  const rows = [
    ['Top 10%', cr.top10],
    ['Top 25%', cr.top25],
    ['Top 50%', cr.top50],
    ['Bottom 50%', cr.bottom50],
    ['Bottom 25%', cr.bottom25],
  ]
    .filter(([, v]) => v != null)
    .map(([label, v]) => [label, (v * 100).toFixed(0) + '%']);

  return `
    <section class="school-section">
      <h2 class="section-title">Class Rank of Enrolled Students</h2>
      <div class="gpa-chart-wrap"><canvas id="class-rank-chart"></canvas></div>
      <p class="chart-caption">Reported as cumulative percentiles (e.g. "top 25%" includes the "top 10%" group), split here into the actual share of the class in each band.</p>
      ${tableHtml(['Percentile', 'Cumulative Share'], rows)}
    </section>`;
}

// ── Render: Admission Factors (name + 4-dot importance meter, 2 columns) ─

const FACTOR_LABELS = {
  rigor: 'Rigor of Secondary School Record', class_rank: 'Class Rank',
  academic_gpa: 'Academic GPA', test_scores: 'Standardized Test Scores',
  essay: 'Application Essay', recommendations: 'Recommendations',
  interview: 'Interview', extracurriculars: 'Extracurricular Activities',
  talent: 'Talent / Ability', character: 'Character / Personal Qualities',
  first_gen: 'First Generation', alumni_relation: 'Alumni/ae Relation',
  geo_residence: 'Geographical Residence', state_residence: 'State Residence',
  religious: 'Religious Affiliation', racial_ethnic: 'Racial / Ethnic Status',
  volunteer: 'Volunteer Work', work_experience: 'Work Experience',
  applicant_interest: "Level of Applicant's Interest",
};

const FACTOR_SCORE = { very_important: 4, important: 3, considered: 2, not_considered: 1 };
const FACTOR_SCORE_LABEL = ['n/a', 'Not considered', 'Considered', 'Important', 'Very important'];

function factorMeter(score) {
  const dots = [1, 2, 3, 4]
    .map(n => `<span class="factor-dot${n <= score ? ' on' : ''}"></span>`).join('');
  return `<span class="factor-meter" title="${FACTOR_SCORE_LABEL[score]}">${dots}</span>`;
}

function renderAdmissionFactorsSection(s) {
  let body = '<p class="no-data">Data not yet available.</p>';

  if (s.admission_factors) {
    const items = Object.entries(FACTOR_LABELS)
      .map(([key, label]) => ({ label, score: FACTOR_SCORE[s.admission_factors[key]] ?? 0 }))
      .filter(it => it.score > 0);

    if (items.length) {
      const rowHtml = it =>
        `<div class="factor-row"><span class="factor-name">${it.label}</span>${factorMeter(it.score)}</div>`;
      const mid = Math.ceil(items.length / 2);
      const legend = [4, 3, 2, 1]
        .map(n => `<span>${factorMeter(n)} ${FACTOR_SCORE_LABEL[n]}</span>`).join('');
      body = `
        <div class="factor-legend">${legend}</div>
        <div class="cols-2 factor-cols">
          <div class="factor-list">${items.slice(0, mid).map(rowHtml).join('')}</div>
          <div class="factor-list">${items.slice(mid).map(rowHtml).join('')}</div>
        </div>`;
    }
  }

  return `
    <section class="school-section">
      <h2 class="section-title">What Matters in the Decision</h2>
      ${body}
    </section>`;
}

// ── Render: Cost section ────────────────────────────────────────────────

function renderCostSection(s) {
  const tuitionIn  = s.tuition_in_state  ?? s.tuition;
  const tuitionOut = s.tuition_out_of_state ?? s.tuition;
  const feesIn     = s.required_fees;
  const feesOut    = s.required_fees;
  const otherIn    = s.other_expenses;
  const otherOut   = s.other_expenses;

  const inTotal  = [tuitionIn,  s.room_and_board, s.books_supplies, feesIn,  otherIn]
    .reduce((a, v) => a + (v || 0), 0);
  const outTotal = [tuitionOut, s.room_and_board, s.books_supplies, feesOut, otherOut]
    .reduce((a, v) => a + (v || 0), 0);

  const rows = [
    ['Tuition',                       fmt(tuitionIn, 'money'),      fmt(tuitionOut, 'money')],
    ['Room &amp; Board',              fmt(s.room_and_board, 'money'), fmt(s.room_and_board, 'money')],
    ['Books &amp; Supplies',          fmt(s.books_supplies, 'money'), fmt(s.books_supplies, 'money')],
    ['Required Fees',                 fmt(feesIn, 'money'),          fmt(feesOut, 'money')],
    ['Other Expenses',                fmt(otherIn, 'money'),         fmt(otherOut, 'money')],
    [
      '<strong>Total Cost of Attendance</strong>',
      inTotal  > 0 ? `<strong>$${inTotal.toLocaleString()}</strong>`  : '<span class="stat-na">n/a</span>',
      outTotal > 0 ? `<strong>$${outTotal.toLocaleString()}</strong>` : '<span class="stat-na">n/a</span>',
    ],
  ];

  const appFee = s.application_fee != null
    ? `<p class="section-note" style="margin-top:14px">Application Fee: <strong>$${s.application_fee}</strong></p>`
    : '';

  return `
    <section class="school-section">
      <h2 class="section-title">Cost</h2>
      ${tableHtml(['', 'In-State', 'Out-of-State'], rows)}
      ${appFee}
    </section>`;
}

// ── Render: Student Body section ────────────────────────────────────────

function renderStudentBodySection(s) {
  let raceHtml = '<p class="no-data">Data not yet available.</p>';

  if (s.demographics_detail?.undergrad) {
    // CDS path — raw counts; convert to fractions using total
    const d     = s.demographics_detail.undergrad;
    const total = d.total || 1;
    raceHtml = `<div class="demo-bars">
      ${demoBarHtml('Asian',                            d.asian            != null ? d.asian            / total : null)}
      ${demoBarHtml('White',                            d.white            != null ? d.white            / total : null)}
      ${demoBarHtml('Hispanic / Latino',                d.hispanic         != null ? d.hispanic         / total : null)}
      ${demoBarHtml('Black / African American',         d.black            != null ? d.black            / total : null)}
      ${demoBarHtml('Nonresident Aliens',               d.nonresident_aliens != null ? d.nonresident_aliens / total : null)}
      ${demoBarHtml('Two or More Races',                d.two_or_more      != null ? d.two_or_more      / total : null)}
      ${demoBarHtml('American Indian / Alaska Native',  d.american_indian  != null ? d.american_indian  / total : null)}
      ${demoBarHtml('Native Hawaiian / Pac. Islander',  d.pacific_islander != null ? d.pacific_islander / total : null)}
      ${demoBarHtml('Unknown',                          d.unknown          != null ? d.unknown          / total : null)}
    </div>`;
  }

  let genderHtml = '<p class="no-data">Data not yet available.</p>';
  if (s.undergrads_male != null && s.total_undergrads) {
    // CDS path — raw counts
    const total = s.total_undergrads;
    genderHtml = `<div class="demo-bars">
      ${demoBarHtml('Men',   s.undergrads_male   / total)}
      ${demoBarHtml('Women', s.undergrads_female / total)}
    </div>`;
  }

  let geoHtml = '<p class="no-data">Data not yet available.</p>';
  if (s.pct_out_of_state != null) {
    const inState = 1 - s.pct_out_of_state;
    geoHtml = `<div class="demo-bars">
      ${demoBarHtml('In-State',      inState > 0 ? inState : null)}
      ${demoBarHtml('Out-of-State',  s.pct_out_of_state)}
    </div>`;
  }

  let transferHtml = '<p class="no-data">Data not yet available.</p>';
  if (s.transfer_stats) {
    const t = s.transfer_stats;
    transferHtml = tableHtml(
      ['', 'Applied', 'Admitted', 'Enrolled'],
      [
        ['Male',   fmt(t.male?.applied),   fmt(t.male?.admitted),   fmt(t.male?.enrolled)],
        ['Female', fmt(t.female?.applied), fmt(t.female?.admitted), fmt(t.female?.enrolled)],
        ['Total',  fmt(t.total?.applied),  fmt(t.total?.admitted),  fmt(t.total?.enrolled)],
      ]
    );
  }

  const ugNote = s.total_undergrads != null
    ? `<p class="section-note">Total Undergraduates: <strong>${s.total_undergrads.toLocaleString()}</strong></p>`
    : '';

  return `
    <section class="school-section">
      <h2 class="section-title">Student Body</h2>
      ${ugNote}
      <h3 class="subsection-title">Race / Ethnicity</h3>
      ${raceHtml}
      <div class="cols-2">
        <div>
          <h3 class="subsection-title">Gender</h3>
          ${genderHtml}
        </div>
        <div>
          <h3 class="subsection-title">Geographic Origin</h3>
          ${geoHtml}
        </div>
      </div>
      <h3 class="subsection-title">Transfer Admissions</h3>
      ${transferHtml}
    </section>`;
}

// ── Init ────────────────────────────────────────────────────────────────

// Same list (and same "later file wins" merge rule) as index.html's
// ALL_YEAR_FILES/loadAllSchools() — a school whose most recent CDS record
// isn't from 2025-2026 would otherwise 404 here even though it correctly
// shows up (with that older record) in the homepage list, since this used
// to fetch only the latest year's file directly.
const ALL_YEAR_FILES = [
  '/data/schools-2021-2022.json',
  '/data/schools-2022-2023.json',
  '/data/schools-2023-2024.json',
  '/data/schools-2024-2025.json',
  '/data/schools-2025-2026.json',
];
const SITE_LATEST_YEAR_KEY = yearKeyFromUrl(ALL_YEAR_FILES[ALL_YEAR_FILES.length - 1]);

// '/data/schools-2025-2026.json' -> '2025-2026'
function yearKeyFromUrl(url) {
  return url.match(/schools-(\d{4}-\d{4})\.json/)?.[1] ?? null;
}

// '2025-2026' -> '2025–26' (matches index.html's shortYearLabel)
function shortYearLabel(key) {
  const [start, end] = key.split('-');
  return `${start}–${end.slice(2)}`;
}

// Loads every year file once and returns both (a) the one-record-per-slug
// list the favorites/history rail needs (same merge rule as index.html:
// each school's single most recent record) and (b) every year *this*
// slug specifically has a record for, keyed by year, so the switcher
// below can offer them all rather than just the latest.
async function loadAllYears(targetSlug) {
  const results = await Promise.all(ALL_YEAR_FILES.map(async url => {
    const yearKey = yearKeyFromUrl(url);
    try {
      const res = await fetch(url);
      if (!res.ok) return { yearKey, schools: [] };
      const { schools } = await res.json();
      return { yearKey, schools: schools.filter(s => s.name != null) };
    } catch (err) {
      console.error(`Failed to load ${url}:`, err);
      return { yearKey, schools: [] };
    }
  }));

  const bySlug = new Map();
  const yearRecords = new Map();
  for (const { yearKey, schools } of results) {
    for (const s of schools) {
      if (!s.slug) continue;
      bySlug.set(s.slug, s); // later (newer) years overwrite, same as index.html
      if (s.slug === targetSlug) yearRecords.set(yearKey, s);
    }
  }

  return {
    allSchools: [...bySlug.values()],
    yearRecords,
    availableYearKeys: ALL_YEAR_FILES.map(yearKeyFromUrl).filter(k => yearRecords.has(k)),
  };
}

async function init() {
  const slug = window.SCHOOL_SLUG || new URLSearchParams(window.location.search).get('school');

  if (!slug) {
    document.getElementById('school-sections').innerHTML =
      '<p class="loading">No school specified. Add <code>?school=mit</code> to the URL.</p>';
    return;
  }

  // Record immediately — synchronous, before any async work
  const historyKey = 'cds_recently_viewed';
  let recentHistory = JSON.parse(localStorage.getItem(historyKey) ?? '[]');
  recentHistory = [slug, ...recentHistory.filter(s => s !== slug)].slice(0, 5);
  localStorage.setItem(historyKey, JSON.stringify(recentHistory));

  const { allSchools, yearRecords, availableYearKeys } = await loadAllYears(slug);

  if (availableYearKeys.length === 0) {
    document.getElementById('school-sections').innerHTML =
      `<p class="loading">School not found: <strong>${slug}</strong></p>`;
    return;
  }

  const meta = SCHOOL_META[slug] ?? { color: '#333', banner: null };
  const latestAvailableKey = availableYearKeys[availableYearKeys.length - 1];
  let currentYearKey = latestAvailableKey;

  document.documentElement.style.setProperty('--brand', meta.color);

  // Everything that depends on which year is currently selected — rerun
  // in full each time the switcher picks a different one. The one-time
  // DOM restructuring below (layout wrapper, sidebar, back link) stays
  // outside this since it only needs to happen once.
  function renderForYear(yearKey) {
    currentYearKey = yearKey;
    const s = yearRecords.get(yearKey);

    document.title = `${s.name} Admissions Data — CommonDataSets`;

    const pct = s.acceptance_rate != null ? (s.acceptance_rate * 100).toFixed(1) + '%' : null;
    const descParts = [`${s.name} admissions data for ${s.data_year}`];
    if (pct) descParts.push(`${pct} acceptance rate`);
    const satRange = s.sat_composite_25 != null
      ? `${s.sat_composite_25}–${s.sat_composite_75} SAT`
      : null;
    if (satRange) descParts.push(satRange);
    if (s.location) descParts.push(s.location);
    document.querySelector('meta[name="description"]').content = descParts.join(' · ') + '.';

    document.getElementById('school-hero').innerHTML = renderHero(s, slug, meta);
    document.getElementById('stats-strip').innerHTML = renderHeroPill(s, slug, meta);
    // .year-bar-strip and .quick-facts-strip aren't in the static HTML
    // template (only school-hero and stats-strip are) — inserted here so
    // the generated pages don't all need editing for these extra
    // containers. Replaced wholesale (not just once) since a year switch
    // can change every value in them. Year bar goes directly below the
    // title card, ahead of quick-facts-strip — it's metadata about which
    // year's data is showing, not data itself, so it precedes all of it.
    document.querySelector('.year-bar-strip')?.remove();
    document.querySelector('.quick-facts-strip')?.remove();
    document.getElementById('stats-strip').insertAdjacentHTML('afterend',
      `<div class="year-bar-strip">${renderYearBar({ currentYearKey: yearKey, availableYearKeys, latestAvailableKey })}</div>`);
    document.querySelector('.year-bar-strip')
      .insertAdjacentHTML('afterend', `<div class="quick-facts-strip">${renderQuickFacts(s)}</div>`);

    document.getElementById('hero-fav-btn').addEventListener('click', () => {
      const favs = getFavs();
      const btn  = document.getElementById('hero-fav-btn');
      if (favs.has(slug)) {
        favs.delete(slug);
        btn.classList.remove('favorited');
        btn.title = 'Add to favorites';
      } else {
        favs.add(slug);
        btn.classList.add('favorited');
        btn.title = 'Remove from favorites';
      }
      saveFavs(favs);
      refreshRail();
    });

    // Re-wired on every render since .stats-strip (hence #year-switcher)
    // is rebuilt from scratch above.
    const switcher = document.getElementById('year-switcher');
    if (switcher) {
      const btn = document.getElementById('year-switcher-btn');
      btn.addEventListener('click', () => switcher.classList.toggle('open'));
      switcher.querySelector('.year-switcher-menu').addEventListener('click', e => {
        const opt = e.target.closest('.sort-option');
        if (!opt || opt.dataset.year === currentYearKey) return;
        renderForYear(opt.dataset.year);
      });
    }

    document.getElementById('school-sections').innerHTML =
      `<div class="school-section-row">
        ${renderAdmissionsSummary(s)}
        ${renderCostSection(s)}
      </div>` +
      renderSelectivitySection(s) +
      renderAcademicProfileSection(s) +
      renderClassRankSection(s) +
      renderAdmissionFactorsSection(s) +
      renderStudentBodySection(s);

    renderGpaHistogram(document.getElementById('gpa-chart'), s.gpa_distribution, meta.color);
    renderClassRankHistogram(document.getElementById('class-rank-chart'), s.class_rank, meta.color);
  }

  renderForYear(currentYearKey);

  // Close the year-switcher menu on an outside click — delegated once at
  // the document level since the menu itself is recreated on every render.
  document.addEventListener('click', e => {
    const switcher = document.getElementById('year-switcher');
    if (switcher && !e.target.closest('#year-switcher')) switcher.classList.remove('open');
  });

  // Inject right sidebar alongside school-sections — one-time DOM
  // restructuring, not repeated on a year switch.
  const sectionsEl = document.getElementById('school-sections');
  const layout = document.createElement('div');
  layout.className = 'school-page-layout';
  sectionsEl.parentElement.insertBefore(layout, sectionsEl);
  layout.appendChild(sectionsEl);

  const sidebar = document.createElement('div');
  sidebar.className = 'right-sidebar';
  sidebar.innerHTML = `
    <div class="history-box" id="school-fav-box" style="display:none">
      <div class="history-title">Favorites</div>
      <div id="school-fav-list"></div>
    </div>
    <div class="history-box" id="school-history-box" style="display:none">
      <div class="history-title">History</div>
      <div id="school-history-list"></div>
    </div>`;
  layout.appendChild(sidebar);

  // Re-render both rail boxes and collapse the whole rail (along with its
  // top border on narrow layouts) when the visitor has neither favorites
  // nor history yet. Hoisted so the hero favorite button can call it too.
  function refreshRail() {
    renderFavoritesBox(allSchools);
    renderHistoryBox(allSchools);
    const railEmpty = ['school-fav-box', 'school-history-box']
      .every(id => document.getElementById(id).style.display === 'none');
    sidebar.style.display = railEmpty ? 'none' : '';
  }

  refreshRail();

  const back = document.createElement('a');
  back.className = 'floating-back';
  back.href = '/';
  back.textContent = '← Schools';
  document.body.appendChild(back);

  const printFab = document.createElement('button');
  printFab.className = 'print-fab';
  printFab.type = 'button';
  printFab.setAttribute('aria-label', 'Print this data');
  printFab.innerHTML = `
    <span class="print-fab-label">Print this data</span>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>`;
  printFab.addEventListener('click', () => window.print());
  document.body.appendChild(printFab);
}

init();
