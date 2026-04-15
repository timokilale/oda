(() => {
  const root = document.documentElement;
  const theme = "day";

  root.dataset.theme = theme;
  root.style.colorScheme = theme === "night" ? "dark" : "light";
})();
