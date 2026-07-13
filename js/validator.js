const phoneRegex = /^(0|\+84)[0-9]{9}$/;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validatePhone(phone) {
  return phoneRegex.test(phone);
}

function validateEmail(email) {
  if (email === "") return true;

  return emailRegex.test(email);
}
