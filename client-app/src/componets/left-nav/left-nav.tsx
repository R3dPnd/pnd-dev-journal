import "./left-nav.scss";

interface Props{
    children: any;
}

export default function PndLeftNav({children}: Props){
    return(
        <div className="left-nav-container">
            {children}
        </div>
    )
}