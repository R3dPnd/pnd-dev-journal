import { useEffect, useState } from "react";
import { Theme } from "../../../constants/colors";
import PndToggle from "../toggle/toggle";

interface Props {
    DarkTheme: Theme;
    LightTheme: Theme;
}

const LIGHT_THEME_LABEL = "Toggle Dark Theme"
const DARK_THEME_LABEL = "Toggle Light Theme"

export default function PndThemeToggle({LightTheme, DarkTheme}:Props){
      const darkThemeMq = window.matchMedia("(prefers-color-scheme: dark)");
      const [darkTheme, setDarkTheme] = useState(darkThemeMq.matches);
      const [label, setLabel] = useState(DARK_THEME_LABEL)

      const ontoggle: any =  () => {
        if(darkTheme){
          setDarkTheme(false)
          setLabel(LIGHT_THEME_LABEL)
        }
        else{
          setDarkTheme(true)
          setLabel(DARK_THEME_LABEL)
        }
      }
      
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
      // <Button
      //   onClick={() =>
      //     setDarkTheme(!darkTheme)
      //   }
      // >
      //   {darkTheme
      //     ? "Switch to Light"
      //     : "Switch to Dark"}
      // </Button>
      <PndToggle label={label} onClick={ontoggle}></PndToggle>
    )
}