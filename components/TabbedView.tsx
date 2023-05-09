import React from "react";

interface Props {
  tabs: Array<{
    title: string;
    view: any;
  }>;
  currentTab: number;
  setCurrentTab: (tab: number) => void;
}

const TabbedView: React.FC<Props> = ({ tabs, currentTab, setCurrentTab}) => {
  
  return (
    <div>
      <div className="flex items-center">
        {tabs.map((tab, index) => {
          return (
            <React.Fragment key={tab.title}>
              <h3
                className={`text-xl mb-5 cursor-pointer border-b-2 ${
                  currentTab === index
                    ? "border-loopring-blue"
                    : "border-transparent"
                }`}
                onClick={() => setCurrentTab(index)}
              >
                {tab.title}
              </h3>
              {index !== tabs.length - 1 && (
                <div className="h-6 w-0.5 mx-2 mb-5 bg-loopring-gray" />
              )}
            </React.Fragment>
          );
        })}
      </div>
      <div className="w-full h-full">
        {tabs.map((tab, index) => {
          return (
            <div
              className={`${currentTab === index ? "visible" : "hidden"}`}
              key={tab.title}
            >
              {tab.view}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TabbedView;
