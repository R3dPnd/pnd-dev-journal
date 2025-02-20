import "./toggle.scss";

interface Props {
    label?: string;
}

export default function Toggle({label}: Props){
    return (
        <label className="switch">
            <input type="checkbox"/>
            <span className="slider round"></span>
        </label>
    )
}