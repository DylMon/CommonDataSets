import { GPA_BUCKETS, renderGpaHistogram, normalizeGpaDistribution } from './charts.js?v=6';

const SCHOOL_META = {
  'mit': { color: '#a41931', banner: 'mit.jpg', y: 50, credit: { author: 'Scutter', license: 'CC BY-NC-ND 2.0', url: 'https://www.flickr.com/photos/scutter/38005464/' } },
  'harvard': { color: '#a6152c', banner: 'harvard.jpg', y: 50, credit: { author: 'Nick Allen', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Harvard_Yard_aerial.JPG' } },
  'stanford': { color: '#8c1515', banner: 'stanford.jpg', y: 50, credit: { author: 'King of Hearts', license: 'CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:Stanford_University_Main_Quad_(cropped).jpg' } },
  'princeton': { color: '#ed6d0b', banner: 'princeton.jpg', y: 49, credit: { author: 'Billy Wilson Photography', license: 'CC BY-NC 2.0', url: 'https://www.flickr.com/photos/billy_wilson/52549207512/' } },
  'yale': { color: '#00356b', banner: 'yale.jpg', y: 50, credit: { author: 'Kenneth C. Zirkel', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Yale_University_Humanities_Quadrangle.jpg' } },
  'columbia': { color: '#6dabe4', banner: 'columbia.jpg', credit: { author: 'Beyond My Ken', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:2014_Columbia_University_Morningside_Heights_campus_from_southwest_.jpg' } },
  'upenn': { color: '#00144d', banner: 'upenn.jpg', credit: { author: 'Mefman00', license: 'CC0 1.0', url: 'https://commons.wikimedia.org/wiki/File:Philadelphia_skyline_from_South_Street_Bridge.jpg' } },
  'caltech': { color: '#ff6e1e', banner: 'caltech.jpg', y: 45, credit: { author: 'Canon.vs.nikon', license: 'CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:Caltech_Entrance.jpg' } },
  'duke': { color: '#363d2e', banner: 'duke.jpg', credit: { author: 'Warren LeMay', license: 'CC0 1.0', url: 'https://commons.wikimedia.org/wiki/File:Davidson_Building,_West_Campus,_Duke_University,_Durham,_NC_(48961119992).jpg' } },
  'jhu': { color: '#918f88', banner: 'jhu.jpg', credit: { author: 'Jerry (Flickr user, Flickr ID 14976045@N02)', license: 'CC BY 2.0', url: 'https://commons.wikimedia.org/wiki/File:Baltimore_Inner_Harbor_Sunny_Day_360_Panorama_(2942076916).jpg' } },
  'northwestern': { color: '#4e2686', banner: 'northwestern.jpg', y: 45, credit: { author: 'Joshsukoff', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Northwestern_University_Aerial.jpg' } },
  'dartmouth': { color: '#00693e', banner: 'dartmouth.jpg', credit: { author: 'Šarūnas Burdulis', license: 'CC BY-SA 2.0', url: 'https://commons.wikimedia.org/wiki/File:Baker_Tower_Panorama_(10292276743).jpg' } },
  'brown': { color: '#a9afb4', banner: 'brown.jpg', y: 55, credit: { author: 'Chris Rycroft', license: 'CC BY 2.0', url: 'https://commons.wikimedia.org/wiki/File:Main_Green_at_Brown_University.jpg' } },
  'vanderbilt': { color: '#aeb1b7', banner: 'vanderbilt.jpg', y: 50, credit: { author: 'Jschnake', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Nashville_Skyline_from_Ft_Negly_2024.jpg' } },
  'rice': { color: '#002169', banner: 'rice.jpg', y: 50, credit: { author: 'faungg\'s photos', license: 'CC BY-ND 2.0', url: 'https://www.flickr.com/photos/44534236@N00/6259498328/' } },
  'washu': { color: '#a60c10', banner: 'washu.jpg', credit: { author: 'Bohao Zhao', license: 'CC BY 3.0', url: 'https://commons.wikimedia.org/wiki/File:St._Louis_Skyline_from_Illinois_-_panoramio.jpg' } },
  'notre-dame': { color: '#7f8883', banner: 'notre-dame.jpg', y: 20, credit: { author: 'picryl', license: 'Public domain', url: 'https://picryl.com/media/ndu-main-building-0bf487' } },
  'cornell': { color: '#b31b1b', banner: 'cornell.jpg', y: 58, credit: { author: 'matt.hintsa', license: 'CC BY-NC-ND 2.0', url: 'https://www.flickr.com/photos/matt_hintsa/3447149391/' } },
  'uchicago': { color: '#a6152c', banner: 'uchicago.jpg', y: 50, credit: { author: 'Trey Ratcliff', license: 'CC BY-NC-SA 2.0', url: 'https://www.flickr.com/photos/stuckincustoms/409484853/' } },
  'cmu': { color: '#c41230', banner: 'cmu.jpg', credit: { author: 'Dllu', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Pittsburgh_city_pano_2015.jpg' } },
  'georgetown': { color: '#041e42', banner: 'georgetown.jpg', credit: { author: 'User:Tomf688 (Tom)', license: 'CC BY-SA 2.5', url: 'https://commons.wikimedia.org/wiki/File:Skyline_of_Washington,_seen_from_Saint_Elizabeths,_August_23,_2006.jpg' } },
  'emory': { color: '#002878', banner: 'emory.jpg', credit: { author: 'London looks', license: 'CC BY 2.0', url: 'https://commons.wikimedia.org/wiki/File:Downtown_Atlanta_skyline_panorama.jpg' } },
  'wake-forest': { color: '#919392', banner: 'wake-forest.jpg', y: 50, credit: { author: 'AL904', license: 'CC BY-NC-ND 2.0', url: 'https://www.flickr.com/photos/al904/14304857788/' } },
  'tufts': { color: '#3172ae', banner: 'tufts.jpg', y: 50, credit: { author: 'John Phelan', license: 'CC BY 3.0', url: 'https://commons.wikimedia.org/wiki/File:Medford_Square,_Medford_MA.jpg' } },
  'ucla': { color: '#017dc3', banner: 'ucla.jpg', y: 45, credit: { author: 'Beyond My Ken', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:2019_UCLA_Royce_Hall_and_Haines_Hall.jpg' } },
  'berkeley': { color: '#193460', banner: 'berkeley.jpg', y: 50, credit: { author: 'Berkeley Lab', license: 'CC BY-NC-ND 2.0', url: 'https://www.flickr.com/photos/berkeleylab/3523153613/' } },
  'ucsb': { color: '#7a4b40', banner: 'ucsb.jpg', y: 50, credit: { author: 'Coolcaesar', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:UCSB_University_Center_and_Storke_Tower.jpg' } },
  'uva': { color: '#232d4b', banner: 'uva.jpg', credit: { author: 'Quintin Soloviev', license: 'CC BY 4.0', url: 'https://commons.wikimedia.org/wiki/File:Charlottesville,_Virginia.jpg' } },
  'umich': { color: '#00274c', banner: 'umich.jpg', y: 45, credit: { author: 'Natecation', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:University_of_Michigan_North_Campus.jpg' } },
  'unc': { color: '#9e8879', banner: 'unc.jpg', y: 43, credit: { author: 'yeungb', license: 'CC BY 2.0', url: 'https://www.flickr.com/photos/yeungb/9432559054/' } },
  'uf': { color: '#83a3cb', banner: 'uf.jpg', y: 29, credit: { author: 'StevenM_61', license: 'CC BY-NC-ND 2.0', url: 'https://www.flickr.com/photos/stevenm_61/51817032991/' } },
  'usc': { color: '#990000', banner: 'usc.jpg', y: 50, credit: { author: 'EEJCC', license: 'CC0', url: 'https://commons.wikimedia.org/wiki/File:USC_globe_tower_and_Waite_Phillips_Hall.jpg' } },
  'nyu': { color: '#58078d', banner: 'nyu.jpg', credit: { author: 'King of Hearts', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Lower_Manhattan_from_Governors_Island_August_2017_panorama.jpg' } },
  'american': { color: '#004fa2', banner: 'american.jpg', y: 50, credit: { author: 'afagen', license: 'CC BY-NC-SA 2.0', url: 'https://www.flickr.com/photos/afagen/53579422920/' } },
  'baylor': { color: '#5d5a3a', banner: 'baylor.jpg', y: 50, credit: { author: 'Michael Barera', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Baylor_University_June_2016_16_(Founders_Mall_and_Pat_Neff_Hall).jpg' } },
  'binghamton': { color: '#005a43', banner: 'binghamton.jpg', y: 50, credit: { author: 'Quintin Soloviev', license: 'CC BY 4.0', url: 'https://commons.wikimedia.org/wiki/File:Binghamton,_New_York_skyline.jpg' } },
  'boston-university': { color: '#cc0000', banner: 'boston-university.jpg', y: 50, credit: { author: 'Nick Allen', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Boston_University_Bridge_aerial.JPG' } },
  'brandeis': { color: '#003478', banner: 'brandeis.jpg', credit: { author: 'Nick Allen (Nickknack00)', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Brandeis_University_aerial_1.JPG' } },
  'buffalo': { color: '#005bbb', banner: 'buffalo.jpg', y: 66, credit: { author: 'Quintin Soloviev', license: 'CC BY 4.0', url: 'https://commons.wikimedia.org/wiki/File:Buffalo,_NY_skyline.jpg' } },
  'case-western': { color: '#003071', banner: 'case-western.jpg', y: 40, credit: { author: 'Erik Drost Derivative work: ForestCityCle216', license: 'CC BY 2.0', url: 'https://commons.wikimedia.org/wiki/File:Cleveland_Skyline_May_2017.jpg' } },
  'clemson': { color: '#6c645b', banner: 'clemson.jpg', y: 50, credit: { author: 'Daderot', license: 'CC0', url: 'https://commons.wikimedia.org/wiki/File:Clemson_Memorial_Stadium_-_Clemson_University_-_DSC07484.JPG' } },
  'drexel': { color: '#07294d', banner: 'drexel.jpg', credit: { author: 'Pierre Blaché', license: 'CC0 1.0', url: 'https://commons.wikimedia.org/wiki/File:Philadelphia_skyline_panorama.jpg' } },
  'fiu': { color: '#081e3f', banner: 'fiu.jpg', credit: { author: 'Denis Santana', license: 'CC BY-SA 2.0', url: 'https://commons.wikimedia.org/wiki/File:Downtown_Miami_skyline_from_PortMiami_2011_wide.jpg' } },
  'fsu': { color: '#782f40', banner: 'fsu.jpg', credit: { author: 'Urbantallahassee', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Tallahassee_Skyline_2023.jpg' } },
  'georgia-tech': { color: '#606a6b', banner: 'georgia-tech.jpg', credit: { author: 'Marc Merlin', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Panorama_of_the_Atlanta_skyline_viewed_from_the_Jackson_Street_Bridge,_June_2015.jpg' } },
  'gwu': { color: '#033c5a', banner: 'gwu.jpg', y: 59, credit: { author: 'Ingfbruno', license: 'CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:USA-The_George_Washington_University.JPG' } },
  'howard': { color: '#003a63', banner: 'howard.jpg', y: 45, credit: { author: 'euthman', license: 'CC BY-SA 2.0', url: 'https://www.flickr.com/photos/euthman/150285269/' } },
  'indiana-bloomington': { color: '#990000', banner: 'indiana-bloomington.jpg', y: 50, credit: { author: 'SUZUKI Hironobu', license: 'CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:Indiana_University_Bloomington_Sample_Gates_-_panoramio.jpg' } },
  'lehigh': { color: '#502d0e', banner: 'lehigh.jpg', credit: { author: 'Tim Kiser (Malepheasant)', license: 'CC BY-SA 2.5', url: 'https://commons.wikimedia.org/wiki/File:Bethlehem_Pennsylvania_downtown.jpg' } },
  'marquette': { color: '#3e3435', banner: 'marquette.jpg', y: 50, credit: { author: 'Danielggpeters', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Marquette_University.jpg' } },
  'miami': { color: '#f47321', banner: 'miami.jpg', credit: { author: 'Marc Averette', license: 'CC0/Public Domain', url: 'https://commons.wikimedia.org/wiki/File:Miami_skyline_(1).jpg' } },
  'michigan-state': { color: '#c3d2ea', banner: 'michigan-state.jpg', y: 37, credit: { author: 'Ken Lund', license: 'CC BY-SA 2.0', url: 'https://www.flickr.com/photos/kenlund/21097692614/' } },
  'nc-state': { color: '#998779', banner: 'nc-state.jpg', credit: { author: 'Abhiram Juvvadi', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Raleigh_Skyline.jpg' } },
  'njit': { color: '#7c6c4c', banner: 'njit.jpg', credit: { author: 'King of Hearts', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Newark_October_2016_panorama.jpg' } },
  'northeastern': { color: '#c8102e', banner: 'northeastern.jpg', credit: { author: 'King of Hearts', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Boston_skyline_from_Longfellow_Bridge_September_2017_panorama_2.jpg' } },
  'ohio-state': { color: '#bb0000', banner: 'ohio-state.jpg', y: 45, credit: { author: 'Jsjessee', license: 'CC BY-SA 2.0', url: 'https://commons.wikimedia.org/wiki/File:Columbus,_Ohio_JJ_71.jpg' } },
  'penn-state': { color: '#001e44', banner: 'penn-state.jpg', credit: { author: 'Goonsnick', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Penn_State_Campus.jpg' } },
  'pepperdine': { color: '#1e2859', banner: 'pepperdine.jpg', credit: { author: 'Kristina D.C. Hoeppner', license: 'CC BY-SA 2.0', url: 'https://commons.wikimedia.org/wiki/File:Pepperdine_University_2011.jpg' } },
  'pitt': { color: '#003594', banner: 'pitt.jpg', credit: { author: 'Dllu', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Pittsburgh_skyline_panorama_daytime.jpg' } },
  'purdue': { color: '#cfb991', banner: 'purdue.jpg', credit: { author: 'Diego Delso', license: 'CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:Purdue_University,_West_Lafayette,_Indiana,_Estados_Unidos,_2012-10-15,_DD_23.jpg' } },
  'rit': { color: '#8a7864', banner: 'rit.jpg', y: 50, credit: { author: 'Christopher Tomkins-Tinch', license: 'CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:Rit_aerial_aug_17_2007.jpg' } },
  'rochester': { color: '#a2a09d', banner: 'rochester.jpg', y: 50, credit: { author: 'Tomwsulcer', license: 'CC0', url: 'https://commons.wikimedia.org/wiki/File:Main_quad_looking_east_at_the_University_of_Rochester.jpg' } },
  'rpi': { color: '#d6001c', banner: 'rpi.jpg', y: 50, credit: { author: 'Wesley Fryer', license: 'CC BY 2.0', url: 'https://www.flickr.com/photos/wfryer/22392839289/' } },
  'santa-clara': { color: '#8c8e90', banner: 'santa-clara.jpg', credit: { author: 'XAtsukex', license: 'CC BY 3.0', url: 'https://commons.wikimedia.org/wiki/File:Panoramic_Downtown_San_Jose.jpg' } },
  'smu': { color: '#dbdcdd', banner: 'smu.jpg', y: 51, credit: { author: 'Michael Barera', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Southern_Methodist_University_July_2016_064_(Gail_O._and_R._Gerald_Turner_Pavilion_and_Blanton_Student_Services_Building).jpg' } },
  'stevens': { color: '#9d1535', banner: 'stevens.jpg', y: 49, credit: { author: 'Jeffrey Vock Photography', license: 'CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:ViewSouthFromHowe.jpg' } },
  'stony-brook': { color: '#990000', banner: 'stony-brook.jpg', y: 45, credit: { author: 'ali eminov', license: 'CC BY-NC 2.0', url: 'https://www.flickr.com/photos/aliarda/40830810933/' } },
  'texas-am': { color: '#150c05', banner: 'texas-am.jpg', y: 60, credit: { author: 'AndreDaGamer', license: 'CC BY 4.0', url: 'https://commons.wikimedia.org/wiki/File:Main_Campus_Texas_A%26M.jpg' } },
  'tulane': { color: '#dd95b1', banner: 'tulane.jpg', y: 85, credit: { author: 'Tulane Public Relations', license: 'CC BY 2.0', url: 'https://commons.wikimedia.org/wiki/File:Tulane_University_(5248829709).jpg' } },
  'uc-davis': { color: '#022851', banner: 'uc-davis.jpg', credit: { author: 'Justin Smith (J.smith)', license: 'CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:Sacramento_Skyline.jpg' } },
  'uc-irvine': { color: '#938562', banner: 'uc-irvine.jpg', y: 50, credit: { author: 'David Eppstein', license: 'CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:SciencePlaza.jpg' } },
  'uc-merced': { color: '#002856', banner: 'uc-merced.jpg', y: 45, credit: { author: 'Qymekkam', license: 'CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:Ansel_adams.JPG' } },
  'uc-riverside': { color: '#757e85', banner: 'uc-riverside.jpg', y: 49, credit: { author: 'Xsolidsnail', license: 'CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:UCR_Belltower_night.JPG' } },
  'uc-san-diego': { color: '#182b49', banner: 'uc-san-diego.jpg', y: 50, credit: { author: 'Leandro\'s World Tour', license: 'CC BY 2.0', url: 'https://www.flickr.com/photos/leandrociuffo/6484576619/' } },
  'uc-santa-cruz': { color: '#7f7d6b', banner: 'uc-santa-cruz.jpg', y: 50, credit: { author: 'dconvertini', license: 'CC BY-SA 2.0', url: 'https://commons.wikimedia.org/wiki/File:Santa_Cruz,_California,_USA18.jpg' } },
  'uconn': { color: '#000e2f', banner: 'uconn.jpg', y: 50, credit: { author: 'jimmywayne', license: 'CC BY-NC-ND 2.0', url: 'https://www.flickr.com/photos/auvet/9762148961/' } },
  'uga': { color: '#ba0c2f', banner: 'uga.jpg', y: 34, credit: { author: 'publicdomainpictures.net', license: 'CC0', url: 'https://www.publicdomainpictures.net/pictures/290000/velka/university-of-georgia-arch.jpg' } },
  'uic': { color: '#d50032', banner: 'uic.jpg', credit: { author: 'Wiknown77', license: 'CC0 1.0', url: 'https://commons.wikimedia.org/wiki/File:Downtown_Chicago_View_From_UIC_University_Hall.jpg' } },
  'uiuc': { color: '#6b585e', banner: 'uiuc.jpg', y: 45, credit: { author: 'University of Illinois Research Park', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:University_of_Illinois_Research_Park_Aerial_View_2017.jpg' } },
  'umass-amherst': { color: '#881c1c', banner: 'umass-amherst.jpg', y: 50, credit: { author: 'Eraboin at English Wikipedia', license: 'CC BY 2.5', url: 'https://commons.wikimedia.org/wiki/File:Umass_Amherst_Skyline.jpg' } },
  'usf': { color: '#9bac9a', banner: 'usf.jpg', y: 50, credit: { author: 'Clément Bardot', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Downtown_Tampa,_Florida.jpg' } },
  'ut-austin': { color: '#bf5700', banner: 'ut-austin.jpg', credit: { author: 'Larry D. Moore (Nv8200pa)', license: 'CC BY 4.0', url: 'https://commons.wikimedia.org/wiki/File:Austin_Skyline_from_the_Southeast_2022.jpg' } },
  'villanova': { color: '#002664', banner: 'villanova.jpg', y: 50, credit: { author: 'abbike18', license: 'CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:Villanova_Church.jpg' } },
  'virginia-tech': { color: '#423834', banner: 'virginia-tech.jpg', y: 50, credit: { author: 'Idawriter', license: 'CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:Downtown,_Blacksburg,_VA,_USA_-_panoramio_(1).jpg' } },
  'washington-seattle': { color: '#4b2e83', banner: 'washington-seattle.jpg', credit: { author: 'SounderBruce', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Seattle_skyline_from_Kerry_Park,_March_2019.jpg' } },
  'william-mary': { color: '#004e38', banner: 'william-mary.jpg', y: 50, credit: { author: 'Pbritti', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Alumni_House_at_the_College_of_William_and_Mary,_2020.jpg' } },
  'wisconsin-madison': { color: '#c5050c', banner: 'wisconsin-madison.jpg', credit: { author: 'James Steakley', license: 'CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:Henry_Mall,_University_of_Wisconsin.jpg' } },
  'wpi': { color: '#a6192e', banner: 'wpi.jpg', credit: { author: 'Anthonyt31201', license: 'CC0 1.0', url: 'https://commons.wikimedia.org/wiki/File:Worcester_Skyline,_November_2024.jpg' } },
  'asu': { color: '#6e6363', banner: 'asu.jpg', y: 50, credit: { author: 'Hunter Trick (TrickHunter)', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:231118-10_ASU_Research_Park.jpg' } },
  'chapman': { color: '#a97a8b', banner: 'chapman.jpg', y: 50, credit: { author: 'Bobak Ha\'Eri', license: 'CC BY 3.0', url: 'https://commons.wikimedia.org/wiki/File:2008-0614-LA-OC-005-Chapman.jpg' } },
  'clarkson': { color: '#0D433B', banner: 'clarkson.jpg', y: 50, credit: { author: 'John Marino', license: 'CC0', url: 'https://commons.wikimedia.org/wiki/File:Potsdam_New_York.jpg' } },
  'coloradoboulder': { color: '#6e7e21', banner: 'coloradoboulder.jpg', y: 50, credit: { author: 'cuboulder', license: 'CC0', url: 'https://commons.wikimedia.org/wiki/File:Aerial8_(23928920228).jpg' } },
  'colorado-state': { color: '#515f48', banner: 'colorado-state.jpg', credit: { author: 'LUSportsFan', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Moby_Arena.JPG' } },
  'creighton': { color: '#6a7972', banner: 'creighton.jpg', y: 64, credit: { author: 'Tony Webster', license: 'CC BY 2.0', url: 'https://commons.wikimedia.org/wiki/File:Creighton_University_-_Omaha,_Nebraska_(44209349534).jpg' } },
  'famu': { color: '#D44500', banner: 'famu.jpg', credit: { author: 'Urbantallahassee', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Tallahassee_Skyline_2023.jpg' } },
  'florida-atlantic': { color: '#003366', banner: 'florida-atlantic.jpg', y: 51, credit: { author: 'Kmgcoolguy4', license: 'CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:FAU_Parliament_Hall.JPG' } },
  'iowa-state-science-tech': { color: '#d0ced7', banner: 'iowa-state-science-tech.jpg', y: 50, credit: { author: 'Tim Kiser (w:User:Malepheasant)', license: 'CC BY-SA 2.5', url: 'https://commons.wikimedia.org/wiki/File:Ames_Iowa_Main_Street_banner.jpg' } },
  'kansas-state': { color: '#6d746d', banner: 'kansas-state.jpg', y: 46, credit: { author: 'Kzollman', license: 'CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:KSU_Bluemont_Bell_and_Dickens.jpg' } },
  'csulb': { color: '#7f6f68', banner: 'csulb.jpg', y: 45, credit: { author: 'Christophe.Finot', license: 'CC BY-SA 2.5', url: 'https://commons.wikimedia.org/wiki/File:Long_Beach_07.jpg' } },
  'csusb': { color: '#0065BD', banner: 'csusb.jpg', y: 88, credit: { author: 'Amerique', license: 'CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:University_Ave_Entrance,_CSUSB.JPG' } },
  'montclair-state': { color: '#D1190D', banner: 'montclair-state.jpg', y: 55, credit: { author: 'Adam Moss from Tonawanda, New York, United States', license: 'CC BY-SA 2.0', url: 'https://commons.wikimedia.org/wiki/File:Montclair_State_University_(8563826766).jpg' } },
  'oklahoma-state': { color: '#fe5c00', banner: 'oklahoma-state.jpg', credit: { author: 'Helluvamatt', license: 'CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:Edmon_Low_Library.jpg' } },
  'olemiss': { color: '#c8102e', banner: 'olemiss.jpg', y: 50, credit: { author: 'Fredlyfish4', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:University_of_Mississippi_from_Pavilion_parking_garage_1.jpg' } },
  'oregon-state': { color: '#d73f09', banner: 'oregon-state.jpg', credit: { author: 'Greg Keene', license: 'CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:Weatherford_Hall_Oregon_State_University_Greg_Keene.jpg' } },
  'rowan': { color: '#57150B', banner: 'rowan.jpg', y: 50, credit: { author: 'Scott Brody', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Rowan_Business_Hall_Front.png' } },
  'sdsu': { color: '#D41736', banner: 'sdsu.jpg', y: 50, credit: { author: 'StuSeeger', license: 'CC BY 2.0', url: 'https://www.flickr.com/photos/stuseeger/9190187882/' } },
  'templeu': { color: '#9E1B34', banner: 'templeu.jpg', y: 55, credit: { author: 'ajay_suresh', license: 'CC BY 2.0', url: 'https://commons.wikimedia.org/wiki/File:The_Liacouras_Center_-_Temple_University_(53564503499).jpg' } },
  'tennessee-knoxville': { color: '#ff8200', banner: 'tennessee-knoxville.jpg', y: 50, credit: { author: 'jpellgen (@1105_jp)', license: 'CC BY-NC-ND 2.0', url: 'https://www.flickr.com/photos/jpellgen/49986329311/' } },
  'texaschristian': { color: '#a0a7af', banner: 'texaschristian.jpg', y: 50, credit: { author: 'Adam Stanford', license: 'CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:Fort_Worth_Skyline1.jpg' } },
  'ualabama': { color: '#7b7778', banner: 'ualabama.jpg', y: 50, credit: { author: 'Joel יוֹאֵל', license: 'CC BY-SA 2.0', url: 'https://commons.wikimedia.org/wiki/File:University_of_Alabama_Bryant-Denny_Stadium_Panorama.jpg' } },
  'uarkansas': { color: '#f7f8e9', banner: 'uarkansas.jpg', y: 50, credit: { author: 'Brandonrush', license: 'CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:Mount_Sequoyah_and_Fayetteville_from_University_of_Arkansas.jpg' } },
  'ucentralflorida': { color: '#74724e', banner: 'ucentralflorida.jpg', credit: { author: 'Dclemens1971', license: 'CC BY 4.0', url: 'https://commons.wikimedia.org/wiki/File:UCF_Center_for_Emerging_Media.jpg' } },
  'udenver': { color: '#a2706d', banner: 'udenver.jpg', y: 48, credit: { author: 'Flickr user', license: 'CC BY 2.0', url: 'https://commons.wikimedia.org/wiki/File:Full_Denver_skyline.jpg' } },
  'ukentucky': { color: '#a4988a', banner: 'ukentucky.jpg', y: 50, credit: { author: 'John.Nash', license: 'CC BY 2.0', url: 'https://www.flickr.com/photos/illiac1/49920499391/' } },
  'umbc': { color: '#fdb515', banner: 'umbc.jpg', y: 50, credit: { author: 'Quintin Soloviev', license: 'CC BY 4.0', url: 'https://commons.wikimedia.org/wiki/File:Baltimore,_Maryland_skyline.jpg' } },
  'unevada-reno': { color: '#041E42', banner: 'unevada-reno.jpg', y: 50, credit: { author: 'NevadaMarCom', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:University_of_Nevada,_Reno_Campus_Image.jpg' } },
  'usandiego': { color: '#002868', banner: 'usandiego.jpg', credit: { author: 'ewen and donabel', license: 'CC BY 2.0', url: 'https://commons.wikimedia.org/wiki/File:SanDiegoSkyline.jpg' } },
  'ut-dallas': { color: '#e87500', banner: 'ut-dallas.jpg', y: 62, credit: { author: 'Blogger799', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:UTdallas_flag.jpg' } },
  'uvermont': { color: '#154734', banner: 'uvermont.jpg', y: 50, credit: { author: 'AlexiusHoratius', license: 'CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:University_of_Vermont_9.jpg' } },
  'washington-stateu': { color: '#981e32', banner: 'washington-stateu.jpg', credit: { author: 'Spicypepper999', license: 'CC0 1.0', url: 'https://commons.wikimedia.org/wiki/File:Pullman_WSU_Campus,_January_2024.jpg' } },
  'boston-college': { color: '#98002E', banner: 'boston-college.jpg', credit: { author: 'Quintin Soloviev', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Boston_College_campus_aerial_from_above_(Quintin_Soloviev).png' } },
  'bradley': { color: '#e11837', banner: 'bradley.jpg', credit: { author: 'AscendedAnathema', license: 'CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:Bradley_Hall,_Bradley_University.jpg' } },
  'clark': { color: '#ee2e24', banner: 'clark.jpg', y: 28, credit: { author: 'Kenneth C. Zirkel', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Clark_University_campus_scene,_Worcester_Massachusetts.jpg' } },
  'east-carolina': { color: '#706d6d', banner: 'east-carolina.jpg', y: 75, credit: { author: 'Aaron Hines', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:ECU_Student_Center.jpg' } },
  'fairfield': { color: '#80a7b1', banner: 'fairfield.jpg', y: 50, credit: { author: 'Stagophile', license: 'CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:Fairfield_Entrance.JPG' } },
  'hofstra': { color: '#0B1E73', banner: 'hofstra.jpg', y: 27, credit: { author: 'Antony-22', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Hofstra_University_dormitories_2021.jpg' } },
  'suny-albany': { color: '#8491a6', banner: 'suny-albany.jpg', y: 50, credit: { author: 'UpstateNYer', license: 'CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:UAlbanyNanoscienceCenter.jpg' } },
  'udelaware': { color: '#00539f', banner: 'udelaware.jpg', y: 50, credit: { author: 'Parkpay2000', license: 'CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:University_of_Delaware_-_The_Mall.jpg' } },
  'ukansas': { color: '#8d806e', banner: 'ukansas.jpg', y: 49, credit: { author: 'brent flanders', license: 'CC BY-NC-ND 2.0', url: 'https://www.flickr.com/photos/proforged/26077090956/' } },
  'ulouisville': { color: '#AD0000', banner: 'ulouisville.jpg', y: 50, credit: { author: 'Ken Lund', license: 'CC BY-SA 2.0', url: 'https://www.flickr.com/photos/kenlund/95106009/' } },
  'umass-lowell': { color: '#0067B1', banner: 'umass-lowell.jpg', y: 50, credit: { author: 'Ktr101', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Tsongas_Center_at_UMass_Lowell.jpg' } },
  'unc-wilmington': { color: '#007680', banner: 'unc-wilmington.jpg', y: 31, credit: { author: 'DiscoA340', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:University_of_North_Carolina_Wilmington_Main_Campus_(15_August_2023)_176.jpg' } },
  'uofiowa': { color: '#FFCD00', banner: 'uofiowa.jpg', y: 43, credit: { author: 'Tony Webster from Minneapolis, Minnesota', license: 'CC BY-SA 2.0', url: 'https://commons.wikimedia.org/wiki/File:Iowa_Memorial_Union_along_the_Iowa_River_-_University_of_Iowa_(24299238840).jpg' } },
  'uofminnesota-twin-cities': { color: '#7a0019', banner: 'uofminnesota-twin-cities.jpg', credit: { author: 'Guywelch2000', license: 'CC BY 4.0', url: 'https://commons.wikimedia.org/wiki/File:Downtown_Minneapolis_skyline_across_the_Mississippi_River.jpg' } },
  'uoklahoma': { color: '#841617', banner: 'uoklahoma.jpg', y: 50, credit: { author: 'Michael Barera', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:University_of_Oklahoma_July_2019_69_(Bizzell_Memorial_Library).jpg' } },
  'usanfrancisco': { color: '#8a897d', banner: 'usanfrancisco.jpg', y: 49, credit: { author: 'Lightandtruth', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:San_Francisco_from_the_Marin_Headlands_in_August_2022.jpg' } },
  'virginiacommonwealth': { color: '#7c8c99', banner: 'virginiacommonwealth.jpg', credit: { author: 'Bruce Emmerling', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:A_view_of_downtown_Richmond_2_(cropped).jpg' } },
  'illinois-tech': { color: '#CC0000', banner: 'illinois-tech.jpg', credit: { author: 'Buphoff', license: 'CC BY-SA 3.0 (also dual-licensed 2.5/2.0/1.0)', url: 'https://commons.wikimedia.org/wiki/File:Chicago_Skyline_Hi-Res.jpg' } },
  'mizzou': { color: '#7a5453', banner: 'mizzou.jpg', y: 50, credit: { author: 'Don J Schulte', license: 'CC BY-NC-SA 2.0', url: 'https://www.flickr.com/photos/oxherder/4737035215/' } },
  'quinnipiac': { color: '#0C2340', banner: 'quinnipiac.jpg', y: 50, credit: { author: 'Ethan Long', license: 'CC BY-SA 2.0', url: 'https://commons.wikimedia.org/wiki/File:Quinnipiac_University,_Mount_Carmel_Campus,_Hamden,_Connecticut_(53950787945).jpg' } },
  'rutgers-camden': { color: '#cc0033', banner: 'rutgers-camden.jpg', y: 28, credit: { author: 'Adam Moss', license: 'CC BY-SA 2.0', url: 'https://commons.wikimedia.org/wiki/File:Cooper_Street-Rutgers_University_Station.jpg' } },
  'rutgers-newark': { color: '#cc0033', banner: 'rutgers-newark.jpg', y: 30, credit: { author: 'King of Hearts', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Newark_October_2016_panorama.jpg' } },
  'stockton': { color: '#0d6bad', banner: 'stockton.jpg', y: 50, credit: { author: 'SnowFire', license: 'CC BY 4.0', url: 'https://commons.wikimedia.org/wiki/File:Stockton_University_Campus_Center_September_2024.jpg' } },
  'colorado-school-of-mines': { color: '#21314D', banner: 'colorado-school-of-mines.jpg', y: 53, credit: { author: 'pxhere', license: 'CC0', url: 'https://pxhere.com/en/photo/223389' } },
  'saintlouisu': { color: '#00244D', banner: 'saintlouisu.jpg', y: 34, credit: { author: 'pasa47', license: 'CC BY 2.0', url: 'https://www.flickr.com/photos/pasa/23537204776/' } },
  'duquesne': { color: '#8690a3', banner: 'duquesne.jpg', credit: { author: 'Dllu', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Pittsburgh_skyline_panorama_daytime.jpg' } },
  'udayton': { color: '#004B8D', banner: 'udayton.jpg', credit: { author: 'Nheyob', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Chapel_of_the_Immaculate_Conception_(University_of_Dayton)_-_exterior.JPG' } },
  'uidaho': { color: '#F1B300', banner: 'uidaho.jpg', y: 50, credit: { author: 'Spicypepper999', license: 'CC0', url: 'https://commons.wikimedia.org/wiki/File:Moscow_Idaho_aerial,_May_2023.png' } },
  'unewhampshire': { color: '#606350', banner: 'unewhampshire.jpg', y: 50, credit: { author: 'AcrossTheAtlantic', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Thompson_Hall,_UNH_Sunset.jpg' } },
  'uoregon': { color: '#d1d9eb', banner: 'uoregon.jpg', y: 63, credit: { author: 'Visitor7', license: 'CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:Lillis_Complex_(University_of_Oregon).jpg' } },
  'upacific': { color: '#D86018', banner: 'upacific.jpg', credit: { author: 'Quintin Soloviev (Quintinsoloviev)', license: 'CC BY 4.0', url: 'https://commons.wikimedia.org/wiki/File:Aerial_view_of_Stockton,_California_skyline.jpg' } },
  'urhodeisland': { color: '#002147', banner: 'urhodeisland.jpg', y: 50, credit: { author: 'University of Rhode Island Photos', license: 'CC BY 2.0', url: 'https://www.flickr.com/photos/universityofrhodeisland/28287778062/' } },
  'uutah': { color: '#cc0000', banner: 'uutah.jpg', y: 46, credit: { author: 'MrSchmidt', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Presidents_Circle_.jpg' } },
  'valparaiso': { color: '#381e0e', banner: 'valparaiso.jpg', y: 34, credit: { author: 'Runner1928', license: 'CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:Victory_Bell_of_Valparaiso_University_by_Athletics_and_Recreation_Center.jpg' } },
  'wayne-state': { color: '#0c5449', banner: 'wayne-state.jpg', y: 56, credit: { author: 'TheWxResearcher', license: 'CC0', url: 'https://commons.wikimedia.org/wiki/File:Detroit_Skyline_from_Windsor_2025-09-01.jpg' } },
  'csufullerton': { color: '#00244E', banner: 'csufullerton.jpg', y: 55, credit: { author: 'CSUF Photos', license: 'CC BY-NC-SA 2.0', url: 'https://www.flickr.com/photos/csufnewsphotos/51737992728/' } },
  'elon': { color: '#73000a', banner: 'elon.jpg', y: 50, credit: { author: 'bobbsled', license: 'CC BY-SA 2.0', url: 'https://www.flickr.com/photos/mpd01605/3310919534/' } },
  'georgia-state': { color: '#0039a6', banner: 'georgia-state.jpg', credit: { author: 'Marc Merlin', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Atlanta_skyline_from_Jackson_Street_Bridge_2020.jpg' } },
  'michigan-tech': { color: '#9195a2', banner: 'michigan-tech.jpg', y: 49, credit: { author: 'Jcvertin', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Michigan_Tech_campus,_fall_2018..jpg' } },
  'missourri-s&t': { color: '#6e7a65', banner: 'missourri-s&t.jpg', y: 27, credit: { author: 'Steveewatkins', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Havener_Student_Center_at_Missouri_S%26T.jpg' } },
  'north-carolina-charolette': { color: '#9b9fa3', banner: 'north-carolina-charolette.jpg', credit: { author: 'chucka_nc', license: 'CC BY-SA 2.0', url: 'https://commons.wikimedia.org/wiki/File:UNC_Charlotte_-_8617213059.jpg' } },
  'uhouston': { color: '#c8102e', banner: 'uhouston.jpg', y: 50, credit: { author: 'Jason Villanueva', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Buildings-city-houston-skyline-1870617.jpg' } },
  'university-maryland-college-park': { color: '#CE1126', banner: 'university-maryland-college-park.jpg', y: 50, credit: { author: 'Blacktupelo', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:McKeldin_Library_Mall_University_Maryland_College_Park.jpg' } },
  'miamiu': { color: '#62584f', banner: 'miamiu.jpg', y: 50, credit: { author: '636Buster', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Benton_Hall,_Miami_University_5-8-2022.jpg' } },
  'thomas-jefferson': { color: '#1A2650', banner: 'thomas-jefferson.jpg', y: 50, credit: { author: 'Mefman00 - modifications by Maps and stuff (Brian W. Schaller)', license: 'CC0', url: 'https://commons.wikimedia.org/wiki/File:Philadelphia_skyline_from_the_southwest_2015.jpg' } },
  'unebraska-lincoln': { color: '#E41C38', banner: 'unebraska-lincoln.jpg', credit: { author: 'Hanyou23', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Skyline_of_Downtown_Lincoln,_Nebraska,_U.S._(2021_photograph).jpg' } },
  'yeshiva': { color: '#035596', banner: 'yeshiva.jpg', y: 50, credit: { author: 'Beyond My Ken', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Yeshiva_University_Wilf_Campus_marker_and_Max_Stern_Athletic_Center.jpg' } },
  'amherst': { color: '#3f1f69', banner: 'amherst.jpg', y: 35, credit: { author: 'Quintin Soloviev', license: 'CC BY 4.0', url: 'https://commons.wikimedia.org/wiki/File:Amherst,_MA_(cropped).jpg' } },
  'barnard': { color: '#002F6C', banner: 'barnard.jpg', y: 50, credit: { author: 'ajay_suresh', license: 'CC BY 2.0', url: 'https://commons.wikimedia.org/wiki/File:Barnard_College_of_Columbia_University_(52008382627).jpg' } },
  'bowdoin': { color: '#827d7f', banner: 'bowdoin.jpg', y: 45, credit: { author: 'Ilove2run', license: 'CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:Bowdoin_College_Quad.jpg' } },
  'carleton': { color: '#173a79', banner: 'carleton.jpg', y: 47, credit: { author: 'Roy Luck', license: 'CC BY 2.0', url: 'https://commons.wikimedia.org/wiki/File:Carleton_College_from_Laird_Stadium.jpg' } },
  'claremont-mckenna': { color: '#60001E', banner: 'claremont-mckenna.jpg', y: 24, credit: { author: 'CMC Media Team', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:North_Mall_Claremont_McKenna_College.jpg' } },
  'davidson': { color: '#2a3615', banner: 'davidson.jpg', credit: { author: 'Michael Mauney', license: 'CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:Toast_on_Main_Street.jpg' } },
  'hamilton': { color: '#002f86', banner: 'hamilton.jpg', credit: { author: 'Kenneth C. Zirkel', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Hamilton_College_Burke_Library.jpg' } },
  'harvey-mudd': { color: '#fdb913', banner: 'harvey-mudd.jpg', y: 50, credit: { author: 'Imagine at English Wikipedia', license: 'CC BY 2.5', url: 'https://commons.wikimedia.org/wiki/File:Hmc-dartmouth_entrance.jpg' } },
  'pomona': { color: '#005499', banner: 'pomona.jpg', y: 50, credit: { author: 'Nostalgicwisdom', license: 'CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:Mason_Hall_and_the_Academic_Quadrangle,_Pomona_College.jpg' } },
  'swarthmore': { color: '#84000D', banner: 'swarthmore.jpg', y: 50, credit: { author: 'Tlönorbis', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Building_at_Swarthmore_College.JPG' } },
  'urichmond': { color: '#990000', banner: 'urichmond.jpg', credit: { author: 'Jim (Flickr user 10673321@N06)', license: 'CC BY-SA 2.0', url: 'https://commons.wikimedia.org/wiki/File:Skyline_of_Richmond,_Virginia.jpg' } },
  'vassar': { color: '#81878a', banner: 'vassar.jpg', y: 50, credit: { author: 'Akarenbon', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Vassar_College_Main_Building_College_Center_1.jpg' } },
  'washington-and-lee': { color: '#676361', banner: 'washington-and-lee.jpg', y: 50, credit: { author: 'Bobak Ha\'Eri', license: 'CC BY 3.0', url: 'https://commons.wikimedia.org/wiki/File:2008-0831-WashingtonandLeeUniversity.jpg' } },
  'wellesley': { color: '#57546a', banner: 'wellesley.jpg', credit: { author: 'Todd Van Hoosear', license: 'CC BY-SA 2.0', url: 'https://commons.wikimedia.org/wiki/File:Wellesley_College_(26714214645).jpg' } },
  'williams': { color: '#8c9ba2', banner: 'williams.jpg', y: 50, credit: { author: 'Tim4403224246', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Morgan_Hall_of_Williams_College_in_the_fall_(27_October_2010).jpg' } },
  'wesleyan': { color: '#5b5959', banner: 'wesleyan.jpg', y: 57, credit: { author: 'Joe Mabel', license: 'CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:Wesleyan_University_-_North_and_South_College_01.jpg' } },
  'grinnell': { color: '#DA291C', banner: 'grinnell.jpg', y: 50, credit: { author: 'Smallbones', license: 'CC0', url: 'https://commons.wikimedia.org/wiki/File:Goodnow_Hall_Grinnell_IA.jpg' } },
  'usma-west-point': { color: '#000000', banner: 'usma-west-point.jpg', credit: { author: 'Juliancolton', license: 'Public domain (PD-self)', url: 'https://commons.wikimedia.org/wiki/File:West_Point_US_9W_panorama.jpg' } },
  'auburn': { color: '#7d7976', banner: 'auburn.jpg', credit: { author: 'AuburnPilot', license: 'PD-self (public domain)', url: 'https://commons.wikimedia.org/wiki/File:AuburnALAbove.jpg' } },
  'loyola-marymount': { color: '#80777a', banner: 'loyola-marymount.jpg', y: 50, credit: { author: 'Rami Ammoun', license: 'CC BY 3.0', url: 'https://commons.wikimedia.org/wiki/File:Downtown_La_At_Sunrise_(250094139).jpeg' } },
  'suny-esf': { color: '#a8aea7', banner: 'suny-esf.jpg', y: 55, credit: { author: 'SUNY ESF', license: 'CC BY-NC-SA 2.0', url: 'https://www.flickr.com/photos/sunyesf/11424070635/' } },
  'depaul': { color: '#6c675d', banner: 'depaul.jpg', y: 50, credit: { author: 'quinntheislander', license: 'CC0', url: 'https://commons.wikimedia.org/wiki/File:Chicago-illinois-skyline-skyscrapers-161963.jpg' } },
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
  if (val == null) return '<span class="stat-na">N/A</span>';
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

// Every major section (Selectivity, Admissions, Cost, …) is its own boxed
// card: title bar on top, body content in the outlined/padded box below it
// (see .school-section / .school-section-body in school-template.css).
function sectionWrap(title, bodyHtml) {
  return `
    <section class="school-section">
      <h2 class="section-title">${title}</h2>
      <div class="school-section-body">${bodyHtml}</div>
    </section>`;
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
  // meta.y = vertical focus (%) of the photo — the hero is a thin 140px
  // strip, so this picks which slice of the image shows. Defaults to center.
  const bannerStyle = meta.banner
    ? `background:linear-gradient(180deg, rgba(0,0,0,0.1), rgba(0,0,0,0.4)), url('/images/banners/${meta.banner}?v=2');background-size:cover;background-position:center ${meta.y ?? 50}%;background-repeat:no-repeat`
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
    : '<span class="stat-na">N/A</span>';

  const act25 = s.act_composite_25;
  const act75 = s.act_composite_75;

  const tuitionOOS = s.tuition_out_of_state ?? s.tuition;

  const chips = [
    ['Acceptance Rate', s.acceptance_rate != null ? (s.acceptance_rate * 100).toFixed(1) + '%' : '<span class="stat-na">N/A</span>'],
    ['SAT Range',       satVal],
    ['ACT Range',       act25 != null && act75 != null ? `${act25}–${act75}` : '<span class="stat-na">N/A</span>'],
    ['Avg GPA (W)',     s.avg_gpa_weighted != null ? parseFloat(s.avg_gpa_weighted).toFixed(2) : 'Not reported'],
    ['Undergrads',      s.total_undergrads != null ? s.total_undergrads.toLocaleString() : '<span class="stat-na">N/A</span>'],
    ['Tuition (OOS)',   tuitionOOS != null ? '$' + tuitionOOS.toLocaleString() : '<span class="stat-na">N/A</span>'],
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
    return `<div class="kv-label">${label}</div><div class="kv-val">${val ?? '<span class="stat-na">N/A</span>'}</div>`;
  }

  const kvGrid = `<div class="kv-grid">
    ${kv('Location',                  s.location)}
    ${kv('School Type',               s.school_type)}
    ${kv('Early Action / Decision',   s.ea_ed_type)}
    ${kv('EA/ED Deadline',            s.ea_ed_deadline)}
    ${kv('Regular Decision Deadline', s.rd_deadline)}
    ${kv('Application Fee',           s.application_fee != null ? '$' + s.application_fee : null)}
  </div>`;

  return sectionWrap('Admissions', kvGrid);
}

// ── Render: Selectivity (funnel + admit rates by round and by gender) ───

function renderSelectivitySection(s) {
  const ratePct = s.acceptance_rate != null ? (s.acceptance_rate * 100).toFixed(1) + '%' : null;
  const funnel = `<div class="funnel">
    <div class="funnel-step">
      <div class="funnel-val">${s.applicants_total != null ? s.applicants_total.toLocaleString() : '<span class="stat-na">N/A</span>'}</div>
      <div class="funnel-label">Applied</div>
    </div>
    <div class="funnel-arrow">→</div>
    <div class="funnel-step">
      <div class="funnel-val">${s.admitted_total != null ? s.admitted_total.toLocaleString() : '<span class="stat-na">N/A</span>'}</div>
      <div class="funnel-label">Admitted</div>
      ${ratePct ? `<div class="funnel-pct">${ratePct} rate</div>` : ''}
    </div>
    <div class="funnel-arrow">→</div>
    <div class="funnel-step">
      <div class="funnel-val">${s.enrolled_total != null ? s.enrolled_total.toLocaleString() : '<span class="stat-na">N/A</span>'}</div>
      <div class="funnel-label">Enrolled</div>
    </div>
  </div>`;

  let poolsHtml = '<p class="no-data">Data not yet available.</p>';
  if (s.applicant_pools) {
    const p = s.applicant_pools;
    poolsHtml = tableHtml(
      ['Round', 'Applied', 'Accepted', 'Rate'],
      [
        ['EA / ED', fmt(p.ea?.applied), fmt(p.ea?.admitted ?? p.ea?.accepted),
          p.ea?.rate != null ? (p.ea.rate * 100).toFixed(1) + '%' : '<span class="stat-na">N/A</span>'],
        ['RD', fmt(p.rd?.applied), fmt(p.rd?.admitted ?? p.rd?.accepted),
          p.rd?.rate != null ? (p.rd.rate * 100).toFixed(1) + '%' : '<span class="stat-na">N/A</span>'],
      ]
    );
  }

  let waitlistHtml = '<p class="no-data">Data not yet available.</p>';
  const wl = s.applicant_pools?.waitlist;
  if (wl) {
    waitlistHtml = `<div class="tbl-align-right">${tableHtml(
      ['', 'Students'],
      [
        ['Offered a Spot',  fmt(wl.offered)],
        ['Accepted a Spot', fmt(wl.accepted_spots)],
        ['Admitted',        fmt(wl.enrolled)],
      ]
    )}</div>`;
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

  return sectionWrap('Selectivity', `
    ${funnel}
    <div class="cols-2">
      <div>
        <h3 class="subsection-title">By Round (EA vs RD)</h3>
        ${poolsHtml}
        <h3 class="subsection-title">Waitlist</h3>
        ${waitlistHtml}
      </div>
      <div>
        <h3 class="subsection-title">By Gender</h3>
        ${genderRoundsHtml}
        <h3 class="subsection-title">Transfer Admissions</h3>
        ${transferHtml}
      </div>
    </div>`);
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
          ['SAT', b.sat_submitted_count != null ? b.sat_submitted_count.toLocaleString() : '<span class="stat-na">N/A</span>', b.sat_submitted_pct != null ? (b.sat_submitted_pct * 100).toFixed(0) + '%' : '<span class="stat-na">N/A</span>'],
          ['ACT', b.act_submitted_count != null ? b.act_submitted_count.toLocaleString() : '<span class="stat-na">N/A</span>', b.act_submitted_pct != null ? (b.act_submitted_pct * 100).toFixed(0) + '%' : '<span class="stat-na">N/A</span>'],
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
      ${classRankHtml(s)}
    </div>`;

  let gpaCol = `
    <div>
      <h3 class="subsection-title">GPA Distribution of Enrolled Students</h3>
      <p class="no-data">Data not yet available.</p>
    </div>`;
  const g = normalizeGpaDistribution(s.gpa_distribution);
  if (g) {
    const rows = GPA_BUCKETS.slice().reverse().map(([key, label]) =>
      [label, g[key] != null ? (g[key] * 100).toFixed(0) + '%' : '<span class="stat-na">N/A</span>']);
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

  return sectionWrap('Academic Profile', `
    <div class="cols-2">
      ${scoresCol}
      ${gpaCol}
    </div>`);
}

// ── Class Rank — folded into Academic Profile, under Score Submission ───

function classRankHtml(s) {
  const cr = s.class_rank ?? {};

  const rows = [
    ['Top 10%', cr.top10],
    ['Top 25%', cr.top25],
    ['Top 50%', cr.top50],
    ['Bottom 50%', cr.bottom50],
    ['Bottom 25%', cr.bottom25],
  ]
    .filter(([, v]) => v != null)
    .map(([label, v]) => [label, (v * 100).toFixed(0) + '%']);

  const body = rows.length
    ? tableHtml(['Percentile', 'Cumulative Share'], rows)
    : '<p class="no-data">Not reported in CDS — many high schools no longer calculate class rank.</p>';

  return `
    <h3 class="subsection-title">Class Rank of Enrolled Students</h3>
    ${body}`;
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
const FACTOR_SCORE_LABEL = ['N/A', 'Not considered', 'Considered', 'Important', 'Very important'];

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

  return sectionWrap('What Matters in the Decision', body);
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
      inTotal  > 0 ? `<strong>$${inTotal.toLocaleString()}</strong>`  : '<span class="stat-na">N/A</span>',
      outTotal > 0 ? `<strong>$${outTotal.toLocaleString()}</strong>` : '<span class="stat-na">N/A</span>',
    ],
  ];

  const appFee = s.application_fee != null
    ? `<p class="section-note" style="margin-top:14px">Application Fee: <strong>$${s.application_fee}</strong></p>`
    : '';

  return sectionWrap('Cost', `
    ${tableHtml(['', 'In-State', 'Out-of-State'], rows)}
    ${appFee}`);
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

  const ugNote = s.total_undergrads != null
    ? `<p class="section-note">Total Undergraduates: <strong>${s.total_undergrads.toLocaleString()}</strong></p>`
    : '';

  return sectionWrap('Student Body', `
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
    </div>`);
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

  // Favorites/history: a pullout tab pinned to the bottom of the hero
  // banner (position: absolute inside #school-hero — see css/base.css)
  // rather than an always-visible sidebar column, so #school-sections
  // keeps the full content width and the control scrolls away with the
  // hero instead of floating for the whole page. Reuses the same star
  // glyph as .fav-btn elsewhere on the site.
  //
  // Created once, here, before the first renderForYear() call below —
  // but #school-hero's own innerHTML gets fully replaced on every call
  // (a year switch rebuilds the hero from scratch), which would silently
  // detach these two if they were appended just once. renderForYear
  // re-appends (not re-creates) them after that reset instead, which
  // just moves the existing nodes back into place and preserves their
  // listeners/open-closed state.
  const railTab = document.createElement('button');
  railTab.type = 'button';
  railTab.className = 'rail-tab';
  railTab.setAttribute('aria-label', 'Favorites and recently viewed');
  railTab.setAttribute('aria-expanded', 'false');
  railTab.innerHTML = `<svg viewBox="0 0 24 24"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>`;

  const railDrawer = document.createElement('div');
  railDrawer.className = 'rail-drawer';
  railDrawer.innerHTML = `
    <div class="rail-drawer-inner">
      <div class="history-box" id="school-fav-box" style="display:none">
        <div class="history-title">Favorites</div>
        <div id="school-fav-list"></div>
      </div>
      <div class="history-box" id="school-history-box" style="display:none">
        <div class="history-title">History</div>
        <div id="school-history-list"></div>
      </div>
    </div>`;

  function setDrawerOpen(open) {
    railDrawer.classList.toggle('open', open);
    railTab.setAttribute('aria-expanded', String(open));
  }

  railTab.addEventListener('click', () => setDrawerOpen(!railDrawer.classList.contains('open')));
  document.addEventListener('click', e => {
    if (!e.target.closest('.rail-drawer') && !e.target.closest('.rail-tab')) setDrawerOpen(false);
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setDrawerOpen(false); });

  // Re-render both rail boxes and hide the tab entirely (closing the
  // drawer too) when the visitor has neither favorites nor history yet.
  // Hoisted so the hero favorite button can call it too.
  function refreshRail() {
    renderFavoritesBox(allSchools);
    renderHistoryBox(allSchools);
    const railEmpty = ['school-fav-box', 'school-history-box']
      .every(id => document.getElementById(id).style.display === 'none');
    railTab.style.display = railEmpty ? 'none' : '';
    if (railEmpty) setDrawerOpen(false);
  }

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

    const heroEl = document.getElementById('school-hero');
    heroEl.innerHTML = renderHero(s, slug, meta);
    // innerHTML above just wiped out any previous children — re-append
    // (not re-create) the tab/drawer so they land back inside the new
    // content instead of staying orphaned off in the detached old one.
    heroEl.appendChild(railTab);
    heroEl.appendChild(railDrawer);
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
      renderSelectivitySection(s) +
      `<div class="school-section-row">
        ${renderAdmissionsSummary(s)}
        ${renderCostSection(s)}
      </div>` +
      renderAcademicProfileSection(s) +
      renderAdmissionFactorsSection(s) +
      renderStudentBodySection(s);

    renderGpaHistogram(document.getElementById('gpa-chart'), s.gpa_distribution, meta.color);
  }

  renderForYear(currentYearKey);

  // Close the year-switcher menu on an outside click — delegated once at
  // the document level since the menu itself is recreated on every render.
  document.addEventListener('click', e => {
    const switcher = document.getElementById('year-switcher');
    if (switcher && !e.target.closest('#year-switcher')) switcher.classList.remove('open');
  });

  // Wrap school-sections in the max-width/padding container it's always
  // used — one-time DOM restructuring, not repeated on a year switch.
  const sectionsEl = document.getElementById('school-sections');
  const layout = document.createElement('div');
  layout.className = 'school-page-layout';
  sectionsEl.parentElement.insertBefore(layout, sectionsEl);
  layout.appendChild(sectionsEl);

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
