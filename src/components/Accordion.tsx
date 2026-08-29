import { useState } from "react";

type AccordionItem = {
  title: string;
  content: string;
  icon: string;
  bgColor: string;
  textColor: string;
};

type AccordionProps = {
  items: AccordionItem[];
};

export function Accordion({ items }: AccordionProps) {
  const [openItems, setOpenItems] = useState(() => items.map(() => false));

  return (
    <div className="accordion">
      {items.map((item, index) => {
        const isOpen = openItems[index];
        const contentId = `accordion-content-${index}`;

        return (
          <div className="accordion-item" key={item.title}>
            <button
              type="button"
              className="accordion-trigger"
              aria-expanded={isOpen}
              aria-controls={contentId}
              onClick={() => {
                setOpenItems((currentItems) =>
                  currentItems.map((isItemOpen, itemIndex) =>
                    itemIndex === index ? !isItemOpen : isItemOpen,
                  ),
                );
              }}
            >
              <span
                className="accordion-icon"
                aria-hidden="true"
                style={{ backgroundColor: item.bgColor, color: item.textColor }}
              >
                {item.icon}
              </span>
              <span>{item.title}</span>
            </button>
            {isOpen && <p className="accordion-content" id={contentId}>{item.content}</p>}
          </div>
        );
      })}
    </div>
  );
}
