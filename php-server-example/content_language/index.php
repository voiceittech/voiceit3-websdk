<?php
include('../config.php');
header('Content-Type: application/json');
echo json_encode(array('contentLanguage' => $CONTENT_LANGUAGE));
?>
