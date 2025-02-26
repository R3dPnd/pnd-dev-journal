export interface Theme {
    backgroundColor: string;
    fontColor: string;
    primaryColor: string;
    secondaryColor: string;
    ternaryColor: string;
}

export const LightTheme: Theme = {
    backgroundColor: "#1956F0",
    fontColor: "black",
    primaryColor: "#0F4CE6",
    secondaryColor: "#1956F0",
    ternaryColor: ""
    
}

export const DarkTheme: Theme = {
    backgroundColor: "#062060",
    fontColor: "white",
    primaryColor: "#051A4D",
    secondaryColor: "#062060",
    ternaryColor: ""
}