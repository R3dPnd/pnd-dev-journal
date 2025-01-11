import "./header.scss";

interface Props {
    children: any;
}
export default function Header({children}: Props) {
    return (
        <header className="pnd-header">
            <h1 className="pnd-title">Dev Journal</h1>
            {
                children
            }
        </header>
    );
}