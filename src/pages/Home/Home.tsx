import { useEffect, useState } from "react";
import { Link } from "react-router";

import { supabase } from "../../contexts/supabase/supabase";
import { PostgrestSingleResponse } from "@supabase/supabase-js";

import TopBar from "../../layouts/TopBar/TopBar";

export default function Home() {
  const [data, setData] = useState<PostgrestSingleResponse<
    {
      created_at: string;
      handle: string | null;
      id: string;
    }[]
  > | null>(null);

  useEffect(() => {
    supabase
      .from("profiles")
      .select("*")
      .then((res) => {
        setData(res);
      });
  }, []);

  return (
    <>
      <TopBar />
      <div className="mx-4 flex flex-col">
        <h1>Home</h1>
        <br />
        {data?.data?.map((user) => {
          return (
            <Link to={`/@${user.handle ?? "unknown"}`} key={user.id}>
              {user.handle ?? "unknown" + "::" + user.created_at}
            </Link>
          );
        })}
        <br />
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis in posuere elit. Quisque mollis, massa id
        porttitor ullamcorper, sapien dolor sagittis nisi, vitae mattis purus ipsum vel purus. In sit amet orci vel ex
        iaculis placerat sit amet a diam. Ut nec ex imperdiet, lobortis erat luctus, pharetra nunc. Donec condimentum
        condimentum erat, eget sollicitudin purus laoreet sit amet. Sed eget massa a nibh lobortis lacinia. Nullam eu
        vestibulum ex. Sed eget rhoncus sapien, quis luctus erat. In facilisis convallis augue nec varius. Fusce
        vestibulum sollicitudin tellus a efficitur. Proin viverra ornare porta. In finibus sem dui, non mollis ante
        dapibus eget. Nullam mattis nulla sit amet molestie iaculis. Vestibulum porttitor erat non justo gravida
        consectetur. Donec sit amet viverra turpis. Phasellus vehicula suscipit nunc sed lobortis. Curabitur vel egestas
        sapien, aliquam vehicula quam. Aliquam laoreet venenatis dolor, volutpat pulvinar elit tristique ac. Fusce
        fermentum tortor at felis lobortis molestie. In hac habitasse platea dictumst. Vestibulum ante ipsum primis in
        faucibus orci luctus et ultrices posuere cubilia curae; Donec pulvinar libero eros, vitae rutrum ante placerat
        sed. Vestibulum tristique magna vestibulum neque blandit, id molestie enim tristique. Nulla eget mollis odio.
        Vestibulum dignissim placerat tempor. Quisque egestas ligula erat, a varius libero placerat quis. In eu orci non
        ligula pharetra maximus. Curabitur eu tortor vitae augue pulvinar molestie. Etiam commodo lorem id justo
        ultrices ullamcorper. Quisque a scelerisque nisi, ut varius nibh. Donec varius, eros et tempor venenatis, orci
        ex vestibulum dui, nec accumsan erat lorem id libero. Fusce at purus a mi dictum tristique. Proin dapibus lectus
        ut orci fermentum accumsan. Fusce at eros nibh. Vestibulum laoreet elit augue. Suspendisse posuere elementum
        nibh a gravida. Duis commodo ex ac arcu blandit efficitur. Aliquam nec turpis ullamcorper, molestie nulla a,
        malesuada massa. Vestibulum at justo sed ligula egestas cursus. Nulla posuere lorem ac ligula ornare egestas.
        Phasellus pellentesque, sem vel condimentum auctor, nisi dui faucibus justo, vel pretium nibh nisi at odio.
        Donec consectetur iaculis vehicula. Donec eleifend facilisis pretium. Aliquam sed hendrerit mi. Aliquam erat
        volutpat. Integer lobortis ex in varius tincidunt. Integer turpis justo, commodo quis aliquam sed, fringilla eu
        nunc. Integer eu sagittis libero. Vivamus hendrerit luctus diam, nec blandit ante vestibulum ut. Fusce et arcu
        sapien. Nunc non tincidunt tortor. Cras rhoncus gravida lobortis. Nunc eget euismod justo, eget pharetra lectus.
        Nunc sit amet diam arcu. Nam ex risus, tincidunt eu risus ac, porttitor feugiat ipsum. Mauris interdum justo
        sem, aliquam finibus nibh venenatis vitae. Pellentesque ipsum eros, vulputate vel eros nec, pretium egestas sem.
        Integer sit amet nunc a libero interdum viverra non vitae tellus. Cras vel ante quis massa efficitur scelerisque
        in eu leo. Etiam orci elit, molestie vitae eleifend a, blandit non ante. Nulla facilisi. Phasellus libero erat,
        lacinia eget risus at, consequat condimentum risus. Integer porta metus quis tellus ultrices, quis ultricies
        ipsum tincidunt. Etiam egestas velit eget eros tincidunt, sed placerat sapien pretium. Suspendisse bibendum
        lorem mollis rhoncus semper. Morbi suscipit sit amet enim vel porta. Suspendisse potenti. Duis in lorem ante.
        Mauris nec felis scelerisque, congue metus a, viverra est. Pellentesque consequat, libero in varius mattis, sem
        ipsum laoreet libero, ac ultricies leo urna vel erat. Ut varius a felis ac condimentum. Maecenas dui urna,
        elementum in ultrices ac, condimentum vel ante. Donec eu hendrerit arcu, nec commodo neque. Vivamus a venenatis
        tellus, at euismod urna. Nullam posuere justo lectus, sed bibendum erat finibus vitae. Pellentesque diam dolor,
        feugiat id nisl tempus, congue posuere quam. Nulla ac est quis turpis pharetra efficitur a eget sem.
        Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Pellentesque
        habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Quisque sed tortor ut mi
        pellentesque laoreet eget at lectus. Nunc nisl tellus, ultrices vitae ultrices sed, pulvinar ac nibh. Maecenas
        sed nisl porttitor, finibus dui sit amet, condimentum velit. Phasellus id sollicitudin lectus. Phasellus nec
        turpis nisl. Quisque vestibulum vel lacus a molestie. Nulla a mauris non lectus mollis facilisis vel vel metus.
        In ut dui sollicitudin, fringilla dolor at, rhoncus justo. Phasellus vel lorem in sapien ornare elementum nec
        quis velit. Donec mollis lacus vitae quam auctor, quis dignissim dui ultrices. Phasellus facilisis nunc sit amet
        sollicitudin aliquet. Etiam vestibulum eleifend purus in ullamcorper. Donec convallis tristique elementum. In
        eget lorem eu leo fringilla volutpat volutpat sed urna. Phasellus vitae dictum leo. Mauris vel egestas nunc.
        Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Interdum et malesuada
        fames ac ante ipsum primis in faucibus. Vivamus eleifend nisi sit amet tellus aliquet congue. Morbi elit turpis,
        finibus id maximus in, auctor pellentesque purus. Donec mollis lacus interdum mi tristique pharetra. Nunc urna
        lacus, sagittis id libero quis, gravida ultricies nulla. Mauris congue hendrerit tortor quis viverra. Donec
        consectetur urna massa, ac porta massa mollis eget. Integer sapien risus, porttitor eu turpis in, luctus
        porttitor est. Proin blandit est a lectus imperdiet, eu dignissim ligula aliquet. Fusce imperdiet augue at nibh
        pulvinar sodales at nec dolor. Mauris tempor dignissim orci nec iaculis. Nullam pellentesque tempor dui porta
        tincidunt. Nulla facilisi. Proin quis tortor ipsum. Duis elit odio, auctor sit amet dignissim at, pellentesque
        nec nunc. Etiam lacinia felis at mi lacinia feugiat. Sed a hendrerit felis, a elementum libero. Nunc venenatis
        nec ipsum sodales auctor. Proin malesuada rutrum tortor facilisis faucibus. Etiam mauris augue, gravida et massa
        et, accumsan accumsan nunc. Ut et sollicitudin est. Nam rutrum rhoncus tortor pharetra ornare.
      </div>
    </>
  );
}
