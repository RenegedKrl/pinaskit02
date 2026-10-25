/** Script que roda antes da página aparecer: aplica o tema salvo (ou o do sistema) sem piscar. */
export const THEME_SCRIPT = `try{var t=localStorage.getItem("pk-tema");if(t==="escuro"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}`;
