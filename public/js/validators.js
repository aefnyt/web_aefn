/**
 * Validadores para formularios AEFN
 * Proporciona funciones de validación reutilizables
 */

(function(){
  'use strict';

  window.Validators = window.Validators || {};

  /**
   * Valida un email
   */
  function validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  /**
   * Valida que no esté vacío
   */
  function validateRequired(value) {
    return value && value.trim().length > 0;
  }

  /**
   * Valida URL
   */
  function validateURL(url) {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Valida que tenga longitud mínima
   */
  function validateMinLength(value, minLength) {
    return value && value.length >= minLength;
  }

  /**
   * Valida que tenga longitud máxima
   */
  function validateMaxLength(value, maxLength) {
    return value && value.length <= maxLength;
  }

  /**
   * Valida que sea un número
   */
  function validateNumber(value) {
    return !isNaN(parseFloat(value)) && isFinite(value);
  }

  /**
   * Valida fecha ISO
   */
  function validateDate(dateString) {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  }

  /**
   * Valida un formulario completo (objeto de reglas)
   * Ejemplo: { email: { required: true, email: true }, nombre: { required: true, minLength: 3 } }
   */
  function validateForm(data, rules) {
    const errors = {};

    for (const field in rules) {
      const fieldRules = rules[field];
      const value = data[field];

      if (fieldRules.required && !validateRequired(value)) {
        errors[field] = `${field} es requerido`;
      }

      if (fieldRules.email && value && !validateEmail(value)) {
        errors[field] = `${field} debe ser un email válido`;
      }

      if (fieldRules.url && value && !validateURL(value)) {
        errors[field] = `${field} debe ser una URL válida`;
      }

      if (fieldRules.minLength && value && !validateMinLength(value, fieldRules.minLength)) {
        errors[field] = `${field} debe tener al menos ${fieldRules.minLength} caracteres`;
      }

      if (fieldRules.maxLength && value && !validateMaxLength(value, fieldRules.maxLength)) {
        errors[field] = `${field} no puede exceder ${fieldRules.maxLength} caracteres`;
      }

      if (fieldRules.number && value && !validateNumber(value)) {
        errors[field] = `${field} debe ser un número`;
      }

      if (fieldRules.date && value && !validateDate(value)) {
        errors[field] = `${field} debe ser una fecha válida`;
      }
    }

    return Object.keys(errors).length === 0 ? null : errors;
  }

  /**
   * Muestra errores en el formulario
   */
  function displayFormErrors(form, errors) {
    // Limpiar errores previos
    form.querySelectorAll('.invalid-feedback').forEach(el => {
      el.textContent = '';
      el.style.display = 'none';
    });

    form.querySelectorAll('.is-invalid').forEach(el => {
      el.classList.remove('is-invalid');
    });

    // Mostrar nuevos errores
    if (errors) {
      for (const field in errors) {
        const input = form.querySelector(`[name="${field}"]`);
        if (input) {
          input.classList.add('is-invalid');
          let feedback = input.nextElementSibling;
          
          if (!feedback || !feedback.classList.contains('invalid-feedback')) {
            feedback = document.createElement('div');
            feedback.className = 'invalid-feedback';
            input.parentNode.insertBefore(feedback, input.nextSibling);
          }
          
          feedback.textContent = errors[field];
          feedback.style.display = 'block';
        }
      }
      return false;
    }
    return true;
  }

  /**
   * Limpia los estilos de validación
   */
  function clearFormErrors(form) {
    form.querySelectorAll('.is-invalid').forEach(el => {
      el.classList.remove('is-invalid');
    });

    form.querySelectorAll('.invalid-feedback').forEach(el => {
      el.textContent = '';
      el.style.display = 'none';
    });
  }

  /**
   * Sanitiza entrada para evitar XSS
   */
  function sanitizeInput(input) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return input.replace(/[&<>"']/g, m => map[m]);
  }

  // Exponer funciones públicas
  window.Validators.email = validateEmail;
  window.Validators.required = validateRequired;
  window.Validators.url = validateURL;
  window.Validators.minLength = validateMinLength;
  window.Validators.maxLength = validateMaxLength;
  window.Validators.number = validateNumber;
  window.Validators.date = validateDate;
  window.Validators.form = validateForm;
  window.Validators.displayErrors = displayFormErrors;
  window.Validators.clearErrors = clearFormErrors;
  window.Validators.sanitize = sanitizeInput;
})();
