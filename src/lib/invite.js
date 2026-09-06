/**
 * Codes d'invitation, côté client.
 * Doit rester cohérent avec InviteCodes.java côté serveur.
 */
export const InviteCodes = {
  /** Tolère les minuscules et les espaces d'un code recopié à la main. */
  normalize(code) {
    return (code ?? '').trim().replaceAll(' ', '').toUpperCase();
  }
};
