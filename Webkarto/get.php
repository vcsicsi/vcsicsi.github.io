<?php
header("Access-Control-Allow-Origin: *");
$url="https://www.elte.hu";
if (isset($_GET)) extract($_GET);
$d=file_get_contents($url);
print("$d"); 
?>