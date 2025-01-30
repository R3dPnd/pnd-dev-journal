import Icon from "../icon/icon";
import "./header.scss";

interface Props {
    children: any;
    Title: string;
    SubTitle?: string;
}
export default function Header({children, Title: Header, SubTitle: SubHeader}: Props) {
    return (
        <header className="pnd-header">
            <Icon IconPath="./img/bg-rd-pnd.png"/>
            <div className="pnd-title-container">
            <h1 className="pnd-title">
                <span className="pnd-title">{Header}</span>
                <span className="pnd-sub-title">{SubHeader}</span>
            </h1>
            </div>
            <span className="pnd-children">
            {
                children
            }
            </span>
        </header>
    );
}