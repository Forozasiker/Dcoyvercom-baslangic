<?php 
require __DIR__ . '/System/Discord/Functions.php';

ob_start("ob_gzhandler"); ?>

<!DOCTYPE html><html class="no-js" lang="zxx">
<head>
    <?php 
    require_once './Theme/Head.php';

    $q = isset($_GET['userId']) ? $_GET['userId'] : false;
    
    $URL = "$API_URL/@/leaderboard/user/$q";
        
    $curl = curl_init();

    curl_setopt($curl, CURLOPT_URL, $URL );
    curl_setopt($curl, CURLOPT_CUSTOMREQUEST, 'POST');
    curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode($body));
    curl_setopt($curl, CURLOPT_HTTPHEADER, $request_headers);
    curl_setopt($curl, CURLOPT_USERAGENT, $user_agent);
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);

    $user = curl_exec($curl);
    $code = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    $user = json_decode($user, false);

    if(isset($user->Status) && $user->Status) {

    } else {
         header("location: /users");
         exit();
    }

     ?>
   <title><?= $status->Settings->Name ?> | @<?= $user->Data->username ?></title>
   <meta name="description" content="<?= $status->Settings->Name ?>, Discord Deneyiminizi Şahaneleştirin: Sıralama Sitemizle, Uzak Toplulukların Güzelliklerini Kucaklayın, En İyi Sunucuları Keşfedin ve Yol Arkadaşlarınızla Bağlantı Kurun!">
   <meta name="author" content="Acarfx">
   <meta name="keywords" content="Discord, Discord Sunucu, Sunucu Listesi, Top Discord Sunucuları, Sunucu Sıralama, Discord Toplist, Discord Community, Türk Discord Sunucuları, Discord Tanıtım, Discord Reklam, Discord Davet Linkleri, En İyi Discord Sunucuları, Sunucu Keşfet, Discord Türk Toplist, Discord Top Server List, Discord Sunucu Tanıtımı, Discord Stats, Discord Sunucu Ranking, Türkiye Discord Sunucuları, Discord Advertising, Discord Server Showcase, Discord Sunucu İncelemeleri, Discord Server Explorer, Discord Sunucu İstatistikleri, Türk Top Discord Servers, Discord Server SEO, Discord Community Growth, Discord Sunucu Tanıtım Yarışması, Türkiye'deki En İyi Discord Sunucuları, Discord Sunucu Analizi, Discord Server Exposure, Türk Discord Toplist Sitesi, Discord Sunucu Tanıtım Forumu, Discord Server Promotion Website, Türkiye'de En Çok Üye Sayısına Sahip Discord Sunucuları, Discord SEO Strategies, Türk Discord Toplist Sunucuları, Discord Server Directory, Discord Sunucu Tanıtım Siteleri, Türkiye'de Popüler Discord Sunucuları, Discord Server Search, Türk Discord Sunucu Reklamları, Discord Server Promotion Tactics, Türkiye'de En Aktif Discord Sunucuları, Discord Server Discovery, Discord Sunucu Tanıtımı Forumları, Türk Discord Top Server List, Discord Server Growth, Türkiye'de Bilinen Discord Sunucuları, Discord Server Promotion Channels, Türk Discord Sunucu Keşif Siteleri, Discord Sunucu Analiz Araçları, Türk Discord Sunucu İnceleme Siteleri, Discord Server SEO Tips, Türkiye'deki En İyi Discord Toplist Siteleri, Discord Server SEO Optimization, Türk Discord Sunucu İnceleme Forumları, Discord Server SEO Techniques, Türkiye'deki En Popüler Discord Top Server List, Discord Server SEO Guide, Türk Discord Sunucu Reklam Forumları, Discord Server SEO Ranking, Türkiye'de En Aktif Discord Top Server List, Discord Server SEO Analysis, Türk Discord Sunucu İnceleme Siteleri, Discord Server SEO Services, Türkiye'deki En İyi Discord Toplist Siteleri, Discord Server SEO Keywords, Türk Discord Sunucu Keşif Siteleri, Discord Server SEO Strategies, Türkiye'deki En Popüler Discord Top Server List, Discord Server SEO Optimization, Türk Discord Sunucu İnceleme Siteleri, Discord Server SEO Tools, Türkiye'deki Bilinen Discord Sunucuları, Discord Server SEO Techniques, Türk Discord Sunucu İnceleme Forumları, Discord Server SEO Guide, Türkiye'de En İyi Discord Toplist Siteleri, Discord Server SEO Best Practices,Discord Botları, Discord Bot Listesi, En İyi Discord Botları, Türk Discord Botları, Discord Botları Sıralama, Discord Bot List, Bot Ekleme, Discord Botları Tanıtımı, Türk Discord Botları Toplistesi, Discord Botlarının Sıralandığı Siteler, Bot Keşfetme, Discord Botlarının İncelemesi, Bot Tanıtım Yarışması, Türkiye'de Popüler Discord Botları, Botlarla İlgili İpuçları, Bot Reklamları, Discord Bot Keşfet, Türkçe Discord Botlarının Listesi, En Çok Kullanılan Discord Botları, Discord Botları SEO, Botlarla İlgili Forumlar, Botların Sıralandığı Toplist Siteleri, Discord Botlarının İstatistikleri, Türkiye'de Bilinen Discord Botları, Bot Ekleme Siteleri, Türkçe Discord Botlarının Toplistesi, Discord Botları Keşfetme Siteleri, Botlar İle İlgili Reklam Siteleri, Discord Bot SEO, Bot Tanıtım Taktikleri, Türkiye'de En İyi Discord Botları, Discord Botlarının SEO Stratejileri, Türk Discord Botlarının Listesi, Discord Botlarının Yarışmaları, Türkiye'de En Popüler Discord Botları, Botlarla İlgili İpuçları ve Püf Noktaları, Discord Botlarının Analizi, Discord Botlarının SEO Araçları, Türk Discord Botlarının İnceleme Siteleri, Discord Botları Keşfetme Forumları, Botlar İle İlgili Reklam Stratejileri, Discord Botlarının Yarışma Fikirleri, Türkiye'de Bilinen Discord Botları, Discord Botlarının Sıralama SEO, Botlarla İlgili Analiz Araçları, Türk Discord Botları Hakkında Forumlar, Discord Botları SEO Hizmetleri, Türkiye'deki En İyi Discord Botları, Discord Botları SEO Anahtar Kelimeleri, Türk Discord Botları Keşfetme Siteleri, Discord Botları SEO Stratejileri, Türkiye'deki En Popüler Discord Botları, Botlarla İlgili Forumlar, Discord Botları SEO Optimizasyonu, Türk Discord Botları İnceleme Siteleri, Discord Botları SEO Teknikleri, Türkiye'deki En İyi Discord Bot Toplist Siteleri, Discord Botları SEO Rehberi, Türk Discord Botları İnceleme Forumları, Discord Botları SEO En İyi Uygulamaları,Acarfx, Selahattin Acar, Acarfx Kim, Discord Acarfx, Türk Programcı, Müzisyen ve Yazılım Geliştirici, Discord Sunucu Sahibi Acarfx, Acarfx Discord Top Server List, Acarfx Discord Bot List, Acarfx'in Discord Sunucuları, Acarfx'in Discord Botları, Acarfx'in Müzik Botları, Acarfx'in Programlama Sunucuları, Türk Discord Top Server List, Acarfx'in Top Discord Sunucuları, Acarfx'in En İyi Discord Botları, Türk Discord Sunucu Sahipleri, Acarfx'in Popüler Discord Sunucuları, Acarfx'in Discord Sunucu Tanıtımı, Acarfx'in Discord Bot Tanıtımı, Acarfx'in Discord Sunucu Keşif, Acarfx'in Discord Toplist Sıralama, Acarfx Discord Community, Acarfx'in Discord Sunucu İncelemeleri, Acarfx'in Discord Bot İncelemeleri, Acarfx'in Discord Botları SEO, Acarfx'in Discord Sunucuları SEO, Acarfx'in Discord Botları Reklam">
   <meta name="viewport" content="width=device-width, initial-scale=1">
   <meta name="theme-style-mode" content="1">


   <meta property="og:url" content="https://<?= $_SERVER['SERVER_NAME'] ?>">
   <meta property="og:type" content="website">
   <meta property="og:title" content="<?= $status->Settings->Name ?> |  Bağlan, Keşfet, Topluluklara Katıl!">
   <meta property="og:description" content="<?= $status->Settings->Name ?>, Discord Deneyiminizi Şahaneleştirin: Sıralama Sitemizle, Uzak Toplulukların Güzelliklerini Kucaklayın, En İyi Sunucuları Keşfedin ve Yol Arkadaşlarınızla Bağlantı Kurun!">
   <meta property="og:image" content="https://<?= $_SERVER['SERVER_NAME'] ?>/assets/img/favicon.png">
   <meta name="theme-color" content="#7289DA">
   <meta property="og:banner" content="https://<?= $_SERVER['SERVER_NAME'] ?>/assets/img/logo/marsy-dark-logo.png">
   <link rel="shortcut icon" type="image/x-icon" href="/assets/img/logo/logo.png">

</head>
<body class="body-bg">

   <main>
      <?php  require_once './Theme/Navbar.php' ?>
    
      <?php require_once './Theme/Pages/Sidebar.php' ?>
      <div class="banner-area banner-area1 pos-rel fix pt-80">
         
        
      </div>

      <?php require_once './Theme/Pages/User.php' ?>

      

   </main>
    <?php require_once './Theme/Footer.php' ?>

    <?php require_once './Theme/Preloader.php' ?>

    <div class="progress-wrap">
      <svg class="progress-circle svg-content" width="100%" height="100%" viewBox="-1 -1 102 102">
         <path d="M50,1 a49,49 0 0,1 0,98 a49,49 0 0,1 0,-98"></path>
      </svg>
   </div>
  
   <div class="mode-switch-wrapper my_switcher setting-option">
      <input type="checkbox" class="checkbox" id="chk">
      <label class="label" for="chk">
         <i class="fas fa-moon setColor dark theme__switcher-btn" data-theme="dark"></i>
         <i class="fas fa-sun setColor light theme__switcher-btn" data-theme="light"></i>
         <span class="ball"></span>
      </label>
   </div>

   <?php require_once './Theme/Bottom.php' ?>

</body>
</html>

<?php

$content = ob_get_clean(); 

$minified_content = preg_replace('/\s+/', ' ', $content);

echo $minified_content;

?>