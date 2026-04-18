/**
 * @license
 * MIT License
 * Copyright (c) 2026 D8ger
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { NotFoundPage } from '@base-ui/components';
import { SiteIcon } from '@/lib/site-config';

export default function NotFound() {
  return (  
    <NotFoundPage siteIcon={<SiteIcon />} />
  );
} 