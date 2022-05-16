export function norm(value: string) {
  const from  = "àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþßàáâãäåæçèéêëìíîïðòóôõöøùúûýýþÿŕŕ-_ ";
  const to =    "aaaaaaaceeeeiiiidñoooooouuuuybsaaaaaaaceeeeiiiidoooooouuuyybyrr___";

  for (let i = 0; i < from.length; i++) {
    const char_re = new RegExp(from.charAt(i), "gim");
    value = value.toLowerCase().replace(char_re, to.charAt(i))
  };

  return value.toLowerCase().replace(/[^a-zA-Z0-9_ñ]/g, '').replace(/^#/, '');
}