/**
 * COMENTADO: Funcionalidad de frases pendiente de definir
 *
 * DTO para actualizar una frase de un moodboard
 * @class UpdatePhraseDto
 * @description Define la estructura y validaciones para actualizar una frase
 */

// export class UpdatePhraseDto {
//   /**
//    * @param {Object} data - Datos de la frase a actualizar
//    * @param {string} data.phrase - Nuevo texto de la frase
//    */
//   constructor(data) {
//     this.phrase = data.phrase;
//   }

//   /**
//    * Valida que los datos del DTO sean correctos
//    * @returns {Object} Objeto con isValid y errores
//    */
//   validate() {
//     const errors = [];

//     // Validar phrase
//     if (!this.phrase || typeof this.phrase !== 'string' || this.phrase.trim() === '') {
//       errors.push('El texto de la frase es requerido y debe ser un string válido');
//     }

//     return {
//       isValid: errors.length === 0,
//       errors,
//     };
//   }

//   /**
//    * Convierte el DTO a un objeto plano
//    * @returns {Object} Objeto plano con los datos de la frase
//    */
//   toPlainObject() {
//     return {
//       phrase: this.phrase.trim(),
//     };
//   }
// }
