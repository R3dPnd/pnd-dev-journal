import { useIsMobile, useIsTablet, useIsDesktop, useWindowWidth } from '../../hooks/useMediaQuery';
import PndButton from "../../common/components/button/button";
import PndLeftNav from "../../componets/left-nav/left-nav";
import "./home.scss";

export default function PndHome() {
  // Using the custom hooks
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isDesktop = useIsDesktop();
  const windowWidth = useWindowWidth();

  return (
    <div className="home-page page__main">
      <div className="page__main__sidebar">
        <PndLeftNav>
            <PndButton>Home</PndButton>
            <PndButton>About</PndButton>
            <PndButton>Contact</PndButton>
        </PndLeftNav>
      </div>
      <div className="page__main__content">
        <h2>Window Width Information</h2>
        <div style={{ textAlign: 'left', padding: '20px' }}>
          <p><strong>Current Window Width:</strong> {windowWidth}px</p>
          <p><strong>Is Mobile:</strong> {isMobile ? 'Yes' : 'No'}</p>
          <p><strong>Is Tablet:</strong> {isTablet ? 'Yes' : 'No'}</p>
          <p><strong>Is Desktop:</strong> {isDesktop ? 'Yes' : 'No'}</p>
        </div>
        
        {isMobile && (
          <div style={{ 
            background: 'yellow', 
            padding: '10px', 
            margin: '10px',
            borderRadius: '5px'
          }}>
            📱 Mobile view - Sidebar is hidden!
          </div>
        )}
        
        {isTablet && !isMobile && (
          <div style={{ 
            background: 'orange', 
            padding: '10px', 
            margin: '10px',
            borderRadius: '5px'
          }}>
            📱 Tablet view - Sidebar is smaller
          </div>
        )}
        
        {isDesktop && (
          <div style={{ 
            background: 'lightgreen', 
            padding: '10px', 
            margin: '10px',
            borderRadius: '5px'
          }}>
            💻 Desktop view - Full layout
          </div>
        )}
      </div>
    </div>
  );
} 