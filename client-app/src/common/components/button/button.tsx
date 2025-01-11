import "./button.scss";

interface Props{
    onClick: () => void;
    label?: string;
    children: any;
}

export default function Button({onClick, label, children}: Props){
    return (
        <button className="pnd-button" onClick={onClick}>
            {label}
            {children}
        </button>
    )
}