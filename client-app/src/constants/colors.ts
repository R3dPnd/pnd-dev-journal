export interface Theme {
    backgroundColor: string;
    fontColor: string;
    primaryColor: string;
    secondaryColor: string;
    ternaryColor: string;
}

export const LightTheme: Theme = {
    backgroundColor: "ffff",
    fontColor: "black",
    primaryColor: "blue",
    secondaryColor: "",
    ternaryColor: ""
}

export const DarkTheme: Theme = {
    backgroundColor: "black",
    fontColor: "white",
    primaryColor: "red",
    secondaryColor: "",
    ternaryColor: ""
}