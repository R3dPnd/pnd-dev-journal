import "./icon.scss"

interface Props{
    IconPath: string
}

export default function Icon({IconPath}: Props){
    return (
        <div className="pnd-icon-container">
            <img src={IconPath} alt="icon" className="pnd-icon"/>
        </div>
    )
}