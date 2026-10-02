/**
 * Catalog settings (Admin/Manager) — categories, brands, and tax classes
 * in one tabbed area. These masters back the product catalog (1.2b).
 */
import { useState } from 'react';
import { FolderTree, Percent, Tag } from 'lucide-react';

import CategoriesPanel from '../../components/catalog/CategoriesPanel.jsx';
import BrandsPanel from '../../components/catalog/BrandsPanel.jsx';
import TaxClassesPanel from '../../components/catalog/TaxClassesPanel.jsx';
import { PageHeader, Tabs } from '../../components/ui';

const TABS = [
  { value: 'categories', label: 'Categories', icon: FolderTree, Panel: CategoriesPanel },
  { value: 'brands', label: 'Brands', icon: Tag, Panel: BrandsPanel },
  { value: 'tax', label: 'Tax classes', icon: Percent, Panel: TaxClassesPanel },
];

const CatalogPage = () => {
  const [active, setActive] = useState('categories');

  const ActivePanel = TABS.find((tab) => tab.value === active).Panel;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Catalog settings"
        subtitle="Categories, brands, and tax classes used across products"
      />

      <Tabs tabs={TABS} value={active} onChange={setActive} />

      <ActivePanel />
    </div>
  );
};

export default CatalogPage;
