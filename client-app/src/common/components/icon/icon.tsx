import "./icon.scss"

interface Props{
    IconPath: string
    className?: string
}

export default function PndIcon({IconPath, className}: Props){
    return (
        <div className="pnd-icon-container">
            <img src={IconPath} alt="icon" className={`pnd-icon ${className}`}/>
        </div>
    )
}