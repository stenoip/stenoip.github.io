<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
  $to = $_POST['to'];
  $subject = $_POST['subject'];
  $message = $_POST['message'];
  $headers = "From: youremail@example.com";

  if (mail($to, $subject, $message, $headers)) {
    echo "Email sent successfully!";
  } else {
    echo "Failed to send email.";
  }
}
?>
