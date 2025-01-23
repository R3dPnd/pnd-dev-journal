import { useEffect, useState } from "react";
import { Theme } from "../../../constants/colors";
import Button from "../button/button";

interface Props {
    DarkTheme: Theme;
    LightTheme: Theme;
}
export default function ThemeToggle({LightTheme, DarkTheme}:Props){
      const [darkTheme, setDarkTheme] = useState(true);
    

      
      function setTheme(theme: Theme): void{
        const root = document.documentElement;
        root?.style.setProperty(
          "--background-color",
          theme.backgroundColor
        );
        root?.style.setProperty(
          "--text-color",
          theme.fontColor
        );
        root?.style.setProperty(
          "--primary-color",
          theme.primaryColor
        );
        root?.style.setProperty(
          "--secondary-color",
          theme.secondaryColor
        );
        root?.style.setProperty(
          "--ternary-color",
          theme.ternaryColor
        );
      }
          useEffect(() => {
            let theme = darkTheme ? DarkTheme : LightTheme;
            setTheme(theme);
          }, [darkTheme]);
    return (
      <Button
        onClick={() =>
          setDarkTheme(!darkTheme)
        }
      >
        {darkTheme
          ? "Switch to Light"
          : "Switch to Dark"}
      </Button>
    )
}