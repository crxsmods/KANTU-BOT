// lib/validators.js
export function luhnCheck(num) {
  let sum = 0;
  let shouldDouble = false;
  
  for (let i = num.length - 1; i >= 0; i--) {
    let digit = parseInt(num.charAt(i), 10);
    
    if (shouldDouble) {
      if ((digit *= 2) > 9) digit -= 9;
    }
    
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  
  return (sum % 10) === 0;
}