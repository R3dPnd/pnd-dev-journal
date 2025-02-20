import Icon from "../icon/icon";
import "./header.scss";

interface Props {
    children: any;
    Title: string;
    SubTitle?: string;
    IconPath?: string;
}
export default function Header({children, Title: Header, SubTitle: SubHeader, IconPath}: Props) {
    console.log(IconPath)
    return (
        <header className="pnd-header">
            <div className="pnd-logo">
                { IconPath != undefined ? (
                    <Icon IconPath={IconPath}/>
                ):(<></>)}
            </div>
            <div className="pnd-title-container">
            <h1 className="pnd-title">
                <span className="pnd-title">{Header}</span>
                <span className="pnd-sub-title">{SubHeader}</span>
            </h1>
            </div>
            <span className="pnd-header-btns">
            {
                children
            }
            </span>
        </header>
    );
}